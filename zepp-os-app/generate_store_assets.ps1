Add-Type -AssemblyName System.Drawing

$storeDir = "C:\Users\kavay\.gemini\antigravity\scratch\run-radar\zepp-os-app\store_assets"
if (!(Test-Path $storeDir)) {
    New-Item -ItemType Directory -Path $storeDir | Out-Null
}

# 1. Generate 100x100 Circular Icon
$iconBmp = New-Object System.Drawing.Bitmap 100, 100
$g = [System.Drawing.Graphics]::FromImage($iconBmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([System.Drawing.Color]::Transparent)

$bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 15, 23, 42))
$g.FillEllipse($bgBrush, 2, 2, 96, 96)

$pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 6, 182, 212), 4)
$g.DrawEllipse($pen, 4, 4, 92, 92)

$penOrange = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 249, 115, 22), 3)
$g.DrawArc($penOrange, 14, 14, 72, 72, 210, 120)

$font = New-Object System.Drawing.Font ("Arial", 30, [System.Drawing.FontStyle]::Bold)
$textBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 248, 250, 252))
$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center
$rect = New-Object System.Drawing.RectangleF 0, 0, 100, 100
$g.DrawString("RR", $font, $textBrush, $rect, $sf)

$iconPath = Join-Path $storeDir "icon_100x100.png"
$iconBmp.Save($iconPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$iconBmp.Dispose()
Write-Host "Generated icon: $iconPath"

# 2. Generate 480x480 Round Screenshot
$roundBmp = New-Object System.Drawing.Bitmap 480, 480
$g = [System.Drawing.Graphics]::FromImage($roundBmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([System.Drawing.Color]::FromArgb(255, 10, 15, 30))

$circlePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(100, 6, 182, 212), 4)
$g.DrawEllipse($circlePen, 10, 10, 460, 460)

$fontSmall = New-Object System.Drawing.Font ("Arial", 16, [System.Drawing.FontStyle]::Bold)
$cyanBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 6, 182, 212))
$rectHeader = New-Object System.Drawing.RectangleF 0, 40, 480, 30
$g.DrawString("RUNRADAR TELEMETRY", $fontSmall, $cyanBrush, $rectHeader, $sf)

$fontLarge = New-Object System.Drawing.Font ("Arial", 64, [System.Drawing.FontStyle]::Bold)
$redBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 239, 68, 68))
$rectHr = New-Object System.Drawing.RectangleF 0, 85, 480, 80
$g.DrawString("164", $fontLarge, $redBrush, $rectHr, $sf)

$fontSub = New-Object System.Drawing.Font ("Arial", 14, [System.Drawing.FontStyle]::Regular)
$grayBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 148, 163, 184))
$rectHrSub = New-Object System.Drawing.RectangleF 0, 165, 480, 25
$g.DrawString("BPM - ZONA 4 (UMBRAL)", $fontSub, $grayBrush, $rectHrSub, $sf)

$fontMetricVal = New-Object System.Drawing.Font ("Arial", 36, [System.Drawing.FontStyle]::Bold)
$whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)

$rectPaceVal = New-Object System.Drawing.RectangleF 50, 205, 180, 50
$g.DrawString("4:45", $fontMetricVal, $whiteBrush, $rectPaceVal, $sf)
$rectPaceLbl = New-Object System.Drawing.RectangleF 50, 255, 180, 25
$g.DrawString("RITMO min/km", $fontSub, $grayBrush, $rectPaceLbl, $sf)

$rectCadVal = New-Object System.Drawing.RectangleF 250, 205, 180, 50
$g.DrawString("178", $fontMetricVal, $whiteBrush, $rectCadVal, $sf)
$rectCadLbl = New-Object System.Drawing.RectangleF 250, 255, 180, 25
$g.DrawString("CADENCIA spm", $fontSub, $grayBrush, $rectCadLbl, $sf)

$bannerBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(220, 30, 41, 59))
$g.FillRectangle($bannerBrush, 40, 305, 400, 75)
$bannerBorder = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 249, 115, 22), 2)
$g.DrawRectangle($bannerBorder, 40, 305, 400, 75)

$fontCoachTitle = New-Object System.Drawing.Font ("Arial", 13, [System.Drawing.FontStyle]::Bold)
$orangeBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 249, 115, 22))
$rectCoachT = New-Object System.Drawing.RectangleF 50, 312, 380, 20
$g.DrawString("ORDEN DEL ENTRENADOR:", $fontCoachTitle, $orangeBrush, $rectCoachT, $sf)

$fontCoachMsg = New-Object System.Drawing.Font ("Arial", 15, [System.Drawing.FontStyle]::Bold)
$rectCoachM = New-Object System.Drawing.RectangleF 50, 335, 380, 35
$g.DrawString("Excelente ritmo! Mantener.", $fontCoachMsg, $whiteBrush, $rectCoachM, $sf)

$rectFooter = New-Object System.Drawing.RectangleF 0, 405, 480, 25
$greenBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 34, 197, 94))
$g.DrawString("CONECTADO A RUNRADAR PWA", $fontSub, $greenBrush, $rectFooter, $sf)

$roundPath = Join-Path $storeDir "screen_round_480x480.png"
$roundBmp.Save($roundPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$roundBmp.Dispose()
Write-Host "Generated round screenshot: $roundPath"

# 3. Generate 390x450 Square Screenshot
$sqBmp = New-Object System.Drawing.Bitmap 390, 450
$g = [System.Drawing.Graphics]::FromImage($sqBmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([System.Drawing.Color]::FromArgb(255, 15, 23, 42))

$topBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 30, 41, 59))
$g.FillRectangle($topBrush, 0, 0, 390, 50)
$rectSqTitle = New-Object System.Drawing.RectangleF 0, 12, 390, 30
$g.DrawString("RUNRADAR LIVE", $fontSmall, $cyanBrush, $rectSqTitle, $sf)

$rectSqHr = New-Object System.Drawing.RectangleF 0, 65, 390, 65
$g.DrawString("164", $fontLarge, $redBrush, $rectSqHr, $sf)
$rectSqHrSub = New-Object System.Drawing.RectangleF 0, 135, 390, 25
$g.DrawString("BPM - ZONA 4 (UMBRAL)", $fontSub, $grayBrush, $rectSqHrSub, $sf)

$rectSqPace = New-Object System.Drawing.RectangleF 20, 175, 170, 45
$g.DrawString("4:45", $fontMetricVal, $whiteBrush, $rectSqPace, $sf)
$rectSqPaceLbl = New-Object System.Drawing.RectangleF 20, 220, 170, 25
$g.DrawString("RITMO min/km", $fontSub, $grayBrush, $rectSqPaceLbl, $sf)

$rectSqCad = New-Object System.Drawing.RectangleF 200, 175, 170, 45
$g.DrawString("178", $fontMetricVal, $whiteBrush, $rectSqCad, $sf)
$rectSqCadLbl = New-Object System.Drawing.RectangleF 200, 220, 170, 25
$g.DrawString("CADENCIA spm", $fontSub, $grayBrush, $rectSqCadLbl, $sf)

$g.FillRectangle($bannerBrush, 20, 265, 350, 95)
$g.DrawRectangle($bannerBorder, 20, 265, 350, 95)
$rectSqCT = New-Object System.Drawing.RectangleF 30, 275, 330, 20
$g.DrawString("ORDEN DEL ENTRENADOR:", $fontCoachTitle, $orangeBrush, $rectSqCT, $sf)
$rectSqCM = New-Object System.Drawing.RectangleF 30, 305, 330, 45
$g.DrawString("Excelente ritmo! Mantener.", $fontCoachMsg, $whiteBrush, $rectSqCM, $sf)

$rectSqFoot = New-Object System.Drawing.RectangleF 0, 390, 390, 25
$g.DrawString("CONECTADO A RUNRADAR PWA", $fontSub, $greenBrush, $rectSqFoot, $sf)

$sqPath = Join-Path $storeDir "screen_square_390x450.png"
$sqBmp.Save($sqPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$sqBmp.Dispose()
Write-Host "Generated square screenshot: $sqPath"
