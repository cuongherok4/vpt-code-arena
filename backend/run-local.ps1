# run-local.ps1
# Script để load .env và chạy Spring Boot
# Chạy bằng lệnh: .\run-local.ps1

$envFile = ".env"

if (-Not (Test-Path $envFile)) {
    Write-Error "File .env không tìm thấy! Hãy copy .env.example thành .env và điền thông tin."
    exit 1
}

# Load từng dòng trong .env
Get-Content $envFile | ForEach-Object {
    if ($_ -match "^\s*([^#][^=]+)=(.*)$") {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
        Write-Host "  Loaded: $key"
    }
}

Write-Host ""
Write-Host "✅ Environment loaded! Starting Spring Boot..."
Write-Host ""

./mvnw spring-boot:run
