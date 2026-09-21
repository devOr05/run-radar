Add-Type -AssemblyName System.Drawing

$assetsDir = Join-Path $PSScriptRoot "assets"
if (-not (Test-Path $assetsDir)) {
    New-Item -ItemType Directory -Force -Path $assetsDir | Out-Null
}

$iconPath = Join-Path $assetsDir "icon.png"
$bmp = New-Object System.Drawing.Bitmap(200, 200)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

# Fondo oscuro elegante (#0B0F19)
$bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 11, 15, 25))
$g.FillRectangle($bgBrush, 0, 0, 200, 200)

# Anillos de radar cian
$pen1 = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(40, 0, 240, 255), 2)
$pen2 = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(80, 0, 240, 255), 2)
$pen3 = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180, 0, 240, 255), 3)

$g.DrawEllipse($pen1, 20, 20, 160, 160)
$g.DrawEllipse($pen2, 50, 50, 100, 100)
$g.DrawEllipse($pen3, 75, 75, 50, 50)

# Pulso central cian brillante
$centerBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 0, 240, 255))
$g.FillEllipse($centerBrush, 90, 90, 20, 20)

# Punto de señal esmeralda
$signalBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 16, 185, 129))
$g.FillEllipse($signalBrush, 135, 60, 12, 12)

# Borde exterior suave
$borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(60, 0, 240, 255), 4)
$g.DrawRectangle($borderPen, 2, 2, 196, 196)

$bmp.Save($iconPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()

Write-Host "Icon created at: $iconPath"
