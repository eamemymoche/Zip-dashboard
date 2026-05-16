$ErrorActionPreference = "Stop"

$baseUrl = if ($env:ZIPLINE_BASE_URL) { $env:ZIPLINE_BASE_URL } else { "http://127.0.0.1:3000" }
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$createdBookingNumber = $null
$latestUpdatedAt = $null

function Invoke-JsonRequest {
  param(
    [Parameter(Mandatory = $true)][string]$Method,
    [Parameter(Mandatory = $true)][string]$Url,
    [object]$Body = $null
  )

  $params = @{
    UseBasicParsing = $true
    Uri = $Url
    Method = $Method
    WebSession = $session
  }

  if ($null -ne $Body) {
    $params.ContentType = "application/json"
    $params.Body = ($Body | ConvertTo-Json -Depth 8)
  }

  return Invoke-WebRequest @params
}

function Assert-StatusCode {
  param(
    [Parameter(Mandatory = $true)][string]$Step,
    [Parameter(Mandatory = $true)][int]$Actual,
    [Parameter(Mandatory = $true)][int]$Expected
  )

  if ($Actual -ne $Expected) {
    throw "[FAIL] $Step expected $Expected but got $Actual"
  }

  Write-Host "[OK] $Step => $Actual"
}

try {
  Write-Host "Task24 smoke started against $baseUrl"

  $login = Invoke-JsonRequest -Method "POST" -Url "$baseUrl/api/auth/login" -Body @{
    email = "officer@zipline.com"
    password = "zipline123"
  }
  Assert-StatusCode -Step "Login" -Actual $login.StatusCode -Expected 200

  $sessionCheck = Invoke-JsonRequest -Method "GET" -Url "$baseUrl/api/auth/login"
  Assert-StatusCode -Step "Session check" -Actual $sessionCheck.StatusCode -Expected 200

  $createdBookingNumber = "T24-" + [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
  $create = Invoke-JsonRequest -Method "POST" -Url "$baseUrl/api/order" -Body @{
    bookingNumber = $createdBookingNumber
    serviceDate = "2026-05-16"
    timeSlot = "10:00"
    agentName = "Klook"
    customerName = "Task24 Smoke"
    phone = "0800000000"
    hotel = "Task Hotel"
    room = "101"
    pickupPax = 2
    joinCount = 0
    productPackageName = "ZIPLINE A"
    status = "WAITING"
  }
  Assert-StatusCode -Step "Order create" -Actual $create.StatusCode -Expected 201
  $createJson = $create.Content | ConvertFrom-Json
  $latestUpdatedAt = [int64]$createJson.updatedAt

  $transport = Invoke-JsonRequest -Method "POST" -Url "$baseUrl/api/transport-assignment" -Body @{
    bookingNumber = $createdBookingNumber
    driverCode = "C001"
    vehicleCode = "V001"
    adminNote = "task24 smoke assign"
    updatedAt = $latestUpdatedAt
  }
  Assert-StatusCode -Step "Transport assignment" -Actual $transport.StatusCode -Expected 200
  $transportJson = $transport.Content | ConvertFrom-Json
  $latestUpdatedAt = [int64]$transportJson.updatedAt

  $pickup = Invoke-JsonRequest -Method "POST" -Url "$baseUrl/api/pickup-status" -Body @{
    bookingNumber = $createdBookingNumber
    status = "BOARDED"
    note = "task24 smoke pickup"
    updatedAt = $latestUpdatedAt
  }
  Assert-StatusCode -Step "Pickup status write" -Actual $pickup.StatusCode -Expected 201
  $pickupJson = $pickup.Content | ConvertFrom-Json
  $latestUpdatedAt = [int64]$pickupJson.updatedAt

  $staff = Invoke-JsonRequest -Method "POST" -Url "$baseUrl/api/staff-assignment" -Body @{
    bookingNumber = $createdBookingNumber
    staffAssignments = @("G001", "G002")
    updatedAt = $latestUpdatedAt
  }
  Assert-StatusCode -Step "Staff assignment write" -Actual $staff.StatusCode -Expected 200
  $staffJson = $staff.Content | ConvertFrom-Json
  $latestUpdatedAt = [int64]$staffJson.updatedAt

  $edit = Invoke-JsonRequest -Method "PUT" -Url "$baseUrl/api/order" -Body @{
    bookingNumber = $createdBookingNumber
    customerName = "Task24 Smoke Edited"
    updatedAt = $latestUpdatedAt
  }
  Assert-StatusCode -Step "Order edit" -Actual $edit.StatusCode -Expected 200
  $editJson = $edit.Content | ConvertFrom-Json
  $latestUpdatedAt = [int64]$editJson.updatedAt

  $rootBeforeDelete = Invoke-JsonRequest -Method "GET" -Url "$baseUrl/"
  Assert-StatusCode -Step "Protected root with session" -Actual $rootBeforeDelete.StatusCode -Expected 200
  if ($rootBeforeDelete.Content -notlike "*$createdBookingNumber*") {
    throw "[FAIL] Reload consistency (before delete) - booking not found in rendered HTML."
  }
  Write-Host "[OK] Reload consistency before delete => found $createdBookingNumber"

  $delete = Invoke-JsonRequest -Method "DELETE" -Url "$baseUrl/api/order?bookingNumber=$createdBookingNumber" -Body @{
    updatedAt = $latestUpdatedAt
  }
  Assert-StatusCode -Step "Order delete" -Actual $delete.StatusCode -Expected 200

  $rootAfterDelete = Invoke-JsonRequest -Method "GET" -Url "$baseUrl/"
  Assert-StatusCode -Step "Protected root after delete" -Actual $rootAfterDelete.StatusCode -Expected 200
  if ($rootAfterDelete.Content -like "*$createdBookingNumber*") {
    throw "[FAIL] Reload consistency (after delete) - deleted booking still found in rendered HTML."
  }
  Write-Host "[OK] Reload consistency after delete => booking removed"

  $logout = Invoke-JsonRequest -Method "DELETE" -Url "$baseUrl/api/auth/login"
  Assert-StatusCode -Step "Logout" -Actual $logout.StatusCode -Expected 200

  try {
    $anon = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/" -Method "GET" -WebSession $session -MaximumRedirection 0 -ErrorAction Stop
    if ($anon.StatusCode -ne 307) {
      throw "[FAIL] Post-logout redirect expected 307 but got $($anon.StatusCode)"
    }
    if ($anon.Headers.Location -notlike "/login*") {
      throw "[FAIL] Post-logout redirect expected /login but got $($anon.Headers.Location)"
    }
  } catch {
    if (-not $_.Exception.Response) { throw }
    $response = $_.Exception.Response
    if ([int]$response.StatusCode -ne 307) {
      throw "[FAIL] Post-logout redirect expected 307 but got $([int]$response.StatusCode)"
    }
    if ($response.Headers["Location"] -notlike "/login*") {
      throw "[FAIL] Post-logout redirect expected /login but got $($response.Headers["Location"])"
    }
  }
  Write-Host "[OK] Post-logout redirect => 307 /login"

  Write-Host "Task24 smoke completed successfully."
  exit 0
} catch {
  Write-Error $_
  if ($createdBookingNumber -and $latestUpdatedAt) {
    try {
      $null = Invoke-JsonRequest -Method "DELETE" -Url "$baseUrl/api/order?bookingNumber=$createdBookingNumber" -Body @{
        updatedAt = $latestUpdatedAt
      }
      Write-Host "[CLEANUP] Removed smoke booking $createdBookingNumber"
    } catch {
      Write-Warning "[CLEANUP] Unable to auto-delete smoke booking $createdBookingNumber"
    }
  }
  exit 1
}
