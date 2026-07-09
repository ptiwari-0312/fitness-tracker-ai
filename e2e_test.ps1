# Fitness Tracker - Full E2E API Test Suite
$BASE = "http://localhost:8000/api/v1"
$ts   = [int][double]::Parse((Get-Date -UFormat %s))
$email = "e2e_$ts@test.com"

$pass  = 0
$fail  = 0
$failList = @()

function Assert($label, $ok, $detail) {
    if ($ok) {
        Write-Host "  [PASS] $label" -ForegroundColor Green
        $script:pass++
    } else {
        if ($detail) {
            Write-Host "  [FAIL] $label  ($detail)" -ForegroundColor Red
        } else {
            Write-Host "  [FAIL] $label" -ForegroundColor Red
        }
        $script:fail++
        $script:failList += $label
    }
}

function Invoke-Api {
    param(
        [string]$Method,
        [string]$Path,
        [hashtable]$Body,
        [string]$Token,
        [switch]$ExpectError
    )
    $uri = $BASE + $Path
    $headers = @{ "Content-Type" = "application/json" }
    if ($Token) { $headers["Authorization"] = "Bearer " + $Token }

    $params = @{
        Method      = $Method
        Uri         = $uri
        Headers     = $headers
        ErrorAction = "Stop"
    }
    if ($Body) {
        $params["Body"] = ($Body | ConvertTo-Json -Depth 10)
    }

    try {
        $resp = Invoke-RestMethod @params
        return @{ Ok = $true; Data = $resp; Status = 200 }
    } catch {
        $code = 0
        if ($_.Exception.Response) {
            $code = [int]$_.Exception.Response.StatusCode
        }
        if ($ExpectError) {
            return @{ Ok = $false; Data = $null; Status = $code }
        }
        Write-Host "    -> HTTP $code" -ForegroundColor DarkGray
        return @{ Ok = $false; Data = $null; Status = $code }
    }
}

function Section($name) {
    Write-Host ""
    Write-Host "-- $name" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=================================================" -ForegroundColor Magenta
Write-Host "  FITNESS TRACKER - E2E TEST SUITE" -ForegroundColor Magenta
Write-Host "=================================================" -ForegroundColor Magenta
Write-Host "  Base : $BASE"
Write-Host "  User : $email"
Write-Host ""

$today   = Get-Date -Format "yyyy-MM-dd"
$nowIso  = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

# ---- 1. AUTH: Register ----
Section "1. AUTH - Register"
$r = Invoke-Api -Method POST -Path "/auth/register" -Body @{
    name = "E2E User"; email = $email; password = "Test1234!"
}
Assert "Register new user" ($r.Ok -and $r.Data.access_token)
$ACCESS  = $r.Data.access_token
$REFRESH = $r.Data.refresh_token

# ---- 2. AUTH: Login ----
Section "2. AUTH - Login"
$r = Invoke-Api -Method POST -Path "/auth/login" -Body @{
    email = $email; password = "Test1234!"
}
Assert "Login with valid credentials" ($r.Ok -and $r.Data.access_token)
if ($r.Data.access_token) { $ACCESS = $r.Data.access_token }

# ---- 3. AUTH: Wrong password ----
Section "3. AUTH - Wrong password (expect 401)"
$r = Invoke-Api -Method POST -Path "/auth/login" -Body @{
    email = $email; password = "wrongpass"
} -ExpectError
Assert "Login wrong password -> 401" ($r.Status -eq 401)

# ---- 4. AUTH: Get profile ----
Section "4. AUTH - Get profile"
$r = Invoke-Api -Method GET -Path "/auth/me" -Token $ACCESS
Assert "GET /auth/me returns profile" ($r.Ok -and $r.Data.email -eq $email)

# ---- 5. AUTH: Refresh token ----
Section "5. AUTH - Refresh token"
$r = Invoke-Api -Method POST -Path "/auth/refresh" -Body @{ refresh_token = $REFRESH }
Assert "Refresh token -> new access token" ($r.Ok -and $r.Data.access_token)
if ($r.Data.access_token) { $ACCESS = $r.Data.access_token }

# ---- 6. AUTH: Security ----
Section "6. AUTH - Security: tampered token -> 401"
$r = Invoke-Api -Method GET -Path "/auth/me" -Token "bad.token.here" -ExpectError
Assert "Tampered token -> 401" ($r.Status -eq 401)

Section "7. AUTH - Security: no token -> 401 or 403"
$r = Invoke-Api -Method GET -Path "/auth/me" -ExpectError
Assert "No token -> 401 or 403" ($r.Status -eq 401 -or $r.Status -eq 403)

# ---- WORKOUTS ----
# Workouts API: POST /workouts/logs (WorkoutLogCreate: name, plan_id?, notes?, started_at?)
#               GET /workouts/logs
#               GET /workouts/logs/{id}
#               PATCH /workouts/logs/{id} (WorkoutLogUpdate)
Section "8. WORKOUTS - Create log"
$r = Invoke-Api -Method POST -Path "/workouts/logs" -Token $ACCESS -Body @{
    name = "Morning Run"; notes = "E2E test"
}
Assert "Create workout log" ($r.Ok -and $r.Data.id)
$WID = $r.Data.id

Section "9. WORKOUTS - List logs"
$r = Invoke-Api -Method GET -Path "/workouts/logs" -Token $ACCESS
Assert "List workout logs (>=1)" ($r.Ok -and $r.Data.Count -ge 1)

Section "10. WORKOUTS - Get log by ID"
$r = Invoke-Api -Method GET -Path ("/workouts/logs/" + $WID) -Token $ACCESS
Assert "GET workout log by ID" ($r.Ok -and $r.Data.id -eq $WID)

Section "11. WORKOUTS - Update log"
$r = Invoke-Api -Method PATCH -Path ("/workouts/logs/" + $WID) -Token $ACCESS -Body @{
    notes = "Updated by E2E"; duration_minutes = 30; is_completed = $true
}
Assert "PATCH workout log" $r.Ok

Section "12. WORKOUTS - List exercises"
$r = Invoke-Api -Method GET -Path "/workouts/exercises" -Token $ACCESS
Assert "List exercises library" ($r.Ok -and $r.Data -ne $null)

# ---- MEALS ----
# Meals API: POST /meals/ (create custom meal food item)
#            POST /meals/logs (log a meal with meal_id)
#            GET /meals/summary?date= (nutrition summary)
#            DELETE /meals/logs/{log_id}
Section "13. MEALS - Create custom food item"
$r = Invoke-Api -Method POST -Path "/meals/" -Token $ACCESS -Body @{
    name = "E2E Oats"; serving_size_g = 100; calories = 300; protein_g = 12; carbs_g = 55; fat_g = 5
}
Assert "Create custom meal (food item)" ($r.Ok -and $r.Data.id)
$MEAL_ITEM_ID = $r.Data.id

Section "14. MEALS - Log the meal"
$r = Invoke-Api -Method POST -Path "/meals/logs" -Token $ACCESS -Body @{
    meal_id = $MEAL_ITEM_ID; meal_type = "breakfast"; log_date = $today; quantity = 1.0
}
Assert "Log meal entry" ($r.Ok -and $r.Data.id)
$MLOG_ID = $r.Data.id

Section "15. MEALS - Daily nutrition summary"
$r = Invoke-Api -Method GET -Path ("/meals/summary?date=" + $today) -Token $ACCESS
Assert "Daily nutrition summary (>=300 kcal)" ($r.Ok -and $r.Data.total_calories -ge 300)

Section "16. MEALS - Delete meal log"
$r = Invoke-Api -Method DELETE -Path ("/meals/logs/" + $MLOG_ID) -Token $ACCESS -ExpectError
Assert "DELETE meal log -> 204" ($r.Status -eq 204 -or $r.Ok)

# ---- WATER ----
# Water API: POST /water/ (WaterLogCreate: log_date, amount_ml, logged_at)
#            GET /water/summary?date= (DailyWaterSummary)
#            No DELETE endpoint
Section "17. WATER - Log intake"
$r = Invoke-Api -Method POST -Path "/water/" -Token $ACCESS -Body @{
    log_date = $today; amount_ml = 500; logged_at = $nowIso
}
Assert "Log water intake" ($r.Ok -and $r.Data.id)

Section "18. WATER - Daily summary"
$r = Invoke-Api -Method GET -Path ("/water/summary?date=" + $today) -Token $ACCESS
Assert "Water daily summary (>=500ml)" ($r.Ok -and $r.Data.total_ml -ge 500)

# ---- WEIGHT ----
Section "19. WEIGHT - Log weight"
$r = Invoke-Api -Method POST -Path "/weight/" -Token $ACCESS -Body @{
    weight_kg = 75.5; log_date = $today
}
Assert "Log weight" ($r.Ok -and $r.Data.id)

Section "20. WEIGHT - Progress"
$r = Invoke-Api -Method GET -Path "/weight/progress" -Token $ACCESS
Assert "Weight progress (current_weight > 0)" ($r.Ok -and $r.Data.current_weight -gt 0)

# ---- HABITS ----
Section "21. HABITS - Create habit"
$r = Invoke-Api -Method POST -Path "/habits/" -Token $ACCESS -Body @{
    name = "Drink water"; habit_type = "boolean"; icon = "water-outline"; color = "#3B82F6"
}
Assert "Create habit" ($r.Ok -and $r.Data.id)
$HID = $r.Data.id

Section "22. HABITS - List habits"
$r = Invoke-Api -Method GET -Path "/habits/" -Token $ACCESS
Assert "List habits (>=1)" ($r.Ok -and $r.Data.Count -ge 1)

Section "23. HABITS - Log completion"
$r = Invoke-Api -Method POST -Path ("/habits/" + $HID + "/log") -Token $ACCESS -Body @{
    log_date = $today; is_completed = $true
}
Assert "Log habit as completed" $r.Ok

Section "24. HABITS - Daily summary"
$r = Invoke-Api -Method GET -Path ("/habits/summary?date=" + $today) -Token $ACCESS
Assert "Habits daily summary (>=1 habit)" ($r.Ok -and $r.Data.total_habits -ge 1)

Section "25. HABITS - Delete habit"
$r = Invoke-Api -Method DELETE -Path ("/habits/" + $HID) -Token $ACCESS -ExpectError
Assert "DELETE habit -> 204" ($r.Status -eq 204 -or $r.Ok)

# ---- AI ----
# AI needs an external API key; 503 is expected in dev without one
Section "26. AI - Weekly summary (503 ok without API key)"
$r = Invoke-Api -Method GET -Path "/ai/weekly-summary" -Token $ACCESS -ExpectError
Assert "AI weekly summary (200 or 503 acceptable)" ($r.Ok -or $r.Status -eq 503)

# ---- RESULTS ----
Write-Host ""
Write-Host "=================================================" -ForegroundColor Magenta
if ($fail -eq 0) {
    Write-Host ("  PASSED: " + $pass + "   FAILED: " + $fail) -ForegroundColor Green
} else {
    Write-Host ("  PASSED: " + $pass + "   FAILED: " + $fail) -ForegroundColor Yellow
}
Write-Host "=================================================" -ForegroundColor Magenta

if ($failList.Count -gt 0) {
    Write-Host ""
    Write-Host "  Failed tests:" -ForegroundColor Red
    foreach ($f in $failList) { Write-Host ("    - " + $f) -ForegroundColor Red }
}
Write-Host ""
