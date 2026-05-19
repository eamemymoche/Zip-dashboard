$ErrorActionPreference = "Stop"

$baseUrl = if ($env:ZIPLINE_BASE_URL) { $env:ZIPLINE_BASE_URL } else { "http://127.0.0.1:3000" }
$managerSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$driverSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$createdBookingNumber = $null

function Invoke-JsonRequest {
  param(
    [Parameter(Mandatory = $true)][Microsoft.PowerShell.Commands.WebRequestSession]$Session,
    [Parameter(Mandatory = $true)][string]$Method,
    [Parameter(Mandatory = $true)][string]$Url,
    [object]$Body = $null
  )
  $params = @{
    UseBasicParsing = $true
    Uri = $Url
    Method = $Method
    WebSession = $Session
  }
  if ($null -ne $Body) {
    $params.ContentType = "application/json"
    $params.Body = ($Body | ConvertTo-Json -Depth 8)
  }
  return Invoke-WebRequest @params
}

function Invoke-ExpectStatus {
  param(
    [Parameter(Mandatory = $true)][string]$Step,
    [Parameter(Mandatory = $true)][scriptblock]$Request,
    [Parameter(Mandatory = $true)][int]$ExpectedStatus
  )
  try {
    $response = & $Request
    $actualStatus = [int]$response.StatusCode
  } catch {
    if (-not $_.Exception.Response) { throw }
    $actualStatus = [int]$_.Exception.Response.StatusCode
  }
  if ($actualStatus -ne $ExpectedStatus) {
    throw "[FAIL] $Step expected $ExpectedStatus but got $actualStatus"
  }
  Write-Host "[OK] $Step => $actualStatus"
}

try {
  Write-Host "Task26 guardrail check started against $baseUrl"

  $driverLogin = Invoke-JsonRequest -Session $driverSession -Method "POST" -Url "$baseUrl/api/auth/login" -Body @{
    username = "driver"
    password = "driver123"
  }
  if ([int]$driverLogin.StatusCode -ne 200) {
    throw "[FAIL] Driver login failed with $($driverLogin.StatusCode)"
  }
  Write-Host "[OK] Driver login => 200"

  Invoke-ExpectStatus -Step "Order create role guard" -ExpectedStatus 403 -Request {
    Invoke-JsonRequest -Session $driverSession -Method "POST" -Url "$baseUrl/api/order" -Body @{
      bookingNumber = "T26-ROLE-CHECK"
      serviceDate = "2026-05-16"
      agentName = "Klook"
      customerName = "Role Check"
    }
  }
  Invoke-ExpectStatus -Step "Transport write role guard" -ExpectedStatus 403 -Request {
    Invoke-JsonRequest -Session $driverSession -Method "POST" -Url "$baseUrl/api/transport-assignment" -Body @{
      bookingNumber = "T26-ROLE-CHECK"
      driverCode = "C001"
    }
  }
  Invoke-ExpectStatus -Step "Pickup write role guard" -ExpectedStatus 403 -Request {
    Invoke-JsonRequest -Session $driverSession -Method "POST" -Url "$baseUrl/api/pickup-status" -Body @{
      bookingNumber = "T26-ROLE-CHECK"
      status = "WAITING"
    }
  }
  Invoke-ExpectStatus -Step "Staffing write role guard" -ExpectedStatus 403 -Request {
    Invoke-JsonRequest -Session $driverSession -Method "POST" -Url "$baseUrl/api/staff-assignment" -Body @{
      bookingNumber = "T26-ROLE-CHECK"
      staffAssignments = @("G001")
    }
  }

  $login = Invoke-JsonRequest -Session $managerSession -Method "POST" -Url "$baseUrl/api/auth/login" -Body @{
    username = "officer"
    password = "zipline123"
  }
  if ([int]$login.StatusCode -ne 200) {
    throw "[FAIL] Manager login failed with $($login.StatusCode)"
  }
  Write-Host "[OK] Manager login => 200"

  $createdBookingNumber = "T26-" + [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
  $create = Invoke-JsonRequest -Session $managerSession -Method "POST" -Url "$baseUrl/api/order" -Body @{
    bookingNumber = $createdBookingNumber
    serviceDate = "2026-05-16"
    timeSlot = "11:00"
    agentName = "Klook"
    customerName = "Task26 Conflict"
    phone = "0800000000"
    hotel = "Conflict Hotel"
    room = "102"
    pickupPax = 2
    joinCount = 0
    productPackageName = "ZIPLINE A"
    status = "WAITING"
  }
  if ([int]$create.StatusCode -ne 201) {
    throw "[FAIL] Order create for conflict test failed with $($create.StatusCode)"
  }
  $createJson = $create.Content | ConvertFrom-Json
  $freshUpdatedAt = [int64]$createJson.updatedAt
  $staleUpdatedAt = $freshUpdatedAt - 60000
  Write-Host "[OK] Conflict fixture created => $createdBookingNumber"

  # 409 checks (stale updatedAt)
  Invoke-ExpectStatus -Step "Order edit conflict guard" -ExpectedStatus 409 -Request {
    Invoke-JsonRequest -Session $managerSession -Method "PUT" -Url "$baseUrl/api/order" -Body @{
      bookingNumber = $createdBookingNumber
      customerName = "Should Conflict"
      updatedAt = $staleUpdatedAt
    }
  }
  Invoke-ExpectStatus -Step "Transport conflict guard" -ExpectedStatus 409 -Request {
    Invoke-JsonRequest -Session $managerSession -Method "POST" -Url "$baseUrl/api/transport-assignment" -Body @{
      bookingNumber = $createdBookingNumber
      driverCode = "C001"
      vehicleCode = "V001"
      updatedAt = $staleUpdatedAt
    }
  }
  Invoke-ExpectStatus -Step "Pickup conflict guard" -ExpectedStatus 409 -Request {
    Invoke-JsonRequest -Session $managerSession -Method "POST" -Url "$baseUrl/api/pickup-status" -Body @{
      bookingNumber = $createdBookingNumber
      status = "BOARDED"
      updatedAt = $staleUpdatedAt
    }
  }
  Invoke-ExpectStatus -Step "Staffing conflict guard" -ExpectedStatus 409 -Request {
    Invoke-JsonRequest -Session $managerSession -Method "POST" -Url "$baseUrl/api/staff-assignment" -Body @{
      bookingNumber = $createdBookingNumber
      staffAssignments = @("G001", "G002")
      updatedAt = $staleUpdatedAt
    }
  }

  $delete = Invoke-JsonRequest -Session $managerSession -Method "DELETE" -Url "$baseUrl/api/order?bookingNumber=$createdBookingNumber"
  if ([int]$delete.StatusCode -ne 200) {
    throw "[FAIL] Cleanup delete failed with $($delete.StatusCode)"
  }
  Write-Host "[OK] Cleanup delete => 200"

  Write-Host "Task26 guardrail check completed successfully."
  exit 0
} catch {
  Write-Error $_
  if ($createdBookingNumber) {
    try {
      $null = Invoke-JsonRequest -Session $managerSession -Method "DELETE" -Url "$baseUrl/api/order?bookingNumber=$createdBookingNumber"
      Write-Host "[CLEANUP] Removed conflict fixture booking $createdBookingNumber"
    } catch {
      Write-Warning "[CLEANUP] Could not remove fixture booking $createdBookingNumber"
    }
  }
  exit 1
}
