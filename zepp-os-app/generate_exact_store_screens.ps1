Add-Type -AssemblyName System.Drawing

$storeDir = "C:\Users\kavay\.gemini\antigravity\scratch\run-radar\zepp-os-app\store_assets"
if (!(Test-Path $storeDir)) {
    New-Item -ItemType Directory -Path $storeDir | Out-Null
}

$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center

# Fonts
$fTitle = New-Object System.Drawing.Font ("Arial", 11, [System.Drawing.FontStyle]::Bold)
$fHr = New-Object System.Drawing.Font ("Arial", 52, [System.Drawing.FontStyle]::Bold)
$fSub = New-Object System.Drawing.Font ("Arial", 10, [System.Drawing.FontStyle]::Bold)
$fVal = New-Object System.Drawing.Font ("Arial", 28, [System.Drawing.FontStyle]::Bold)
$fCoachT = New-Object System.Drawing.Font ("Arial", 9, [System.Drawing.FontStyle]::Bold)
$fCoachM = New-Object System.Drawing.Font ("Arial", 11, [System.Drawing.FontStyle]::Bold)

# Colors & Brushes
$cyanBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 0, 240, 255))
$redBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 239, 68, 68))
$whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
$grayBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 148, 163, 184))
$orangeBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 249, 115, 22))
$greenBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 34, 197, 94))
$boxBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(220, 24, 33, 47))
$boxPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 249, 115, 22), 2)

# =========================================================================
# 1. PANTALLA REDONDA (360x360 PNG)
# =========================================================================
$bmpR = New-Object System.Drawing.Bitmap 360, 360
$gR = [System.Drawing.Graphics]::FromImage($bmpR)
$gR.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$gR.Clear([System.Drawing.Color]::FromArgb(255, 10, 15, 29))

# Outer circular bezel
$ringPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(180, 0, 240, 255), 3)
$gR.DrawEllipse($ringPen, 6, 6, 348, 348)

$gR.DrawString("RUNRADAR TELEMETRY", $fTitle, $cyanBrush, (New-Object System.Drawing.RectangleF 0, 32, 360, 22), $sf)
$gR.DrawString("164", $fHr, $redBrush, (New-Object System.Drawing.RectangleF 0, 62, 360, 60), $sf)
$gR.DrawString("BPM - ZONA 4 (UMBRAL)", $fSub, $grayBrush, (New-Object System.Drawing.RectangleF 0, 126, 360, 18), $sf)

$gR.DrawString("4:45", $fVal, $whiteBrush, (New-Object System.Drawing.RectangleF 30, 154, 140, 35), $sf)
$gR.DrawString("RITMO /km", $fSub, $grayBrush, (New-Object System.Drawing.RectangleF 30, 190, 140, 18), $sf)

$gR.DrawString("178", $fVal, $whiteBrush, (New-Object System.Drawing.RectangleF 190, 154, 140, 35), $sf)
$gR.DrawString("CADENCIA spm", $fSub, $grayBrush, (New-Object System.Drawing.RectangleF 190, 190, 140, 18), $sf)

$gR.FillRectangle($boxBrush, 35, 224, 290, 60)
$gR.DrawRectangle($boxPen, 35, 224, 290, 60)
$gR.DrawString("ORDEN DEL ENTRENADOR:", $fCoachT, $orangeBrush, (New-Object System.Drawing.RectangleF 40, 230, 280, 16), $sf)
$gR.DrawString("¡Excelente ritmo! Mantener.", $fCoachM, $whiteBrush, (New-Object System.Drawing.RectangleF 40, 250, 280, 22), $sf)

$gR.DrawString("? VINCULADO AL RADAR DT", $fSub, $greenBrush, (New-Object System.Drawing.RectangleF 0, 305, 360, 20), $sf)

$pathR = Join-Path $storeDir "redonda_360x360.png"
$bmpR.Save($pathR, [System.Drawing.Imaging.ImageFormat]::Png)
$gR.Dispose()
$bmpR.Dispose()
Write-Host "Generated: $pathR"

# =========================================================================
# 2. PANTALLA CUADRADA (360x360 PNG)
# =========================================================================
$bmpS = New-Object System.Drawing.Bitmap 360, 360
$gS = [System.Drawing.Graphics]::FromImage($bmpS)
$gS.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$gS.Clear([System.Drawing.Color]::FromArgb(255, 15, 23, 42))

# Top bar header
$topBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 30, 41, 59))
$gS.FillRectangle($topBrush, 0, 0, 360, 42)
$gS.DrawString("RUNRADAR LIVE", $fTitle, $cyanBrush, (New-Object System.Drawing.RectangleF 0, 11, 360, 24), $sf)

# Heart Rate
$gS.DrawString("164", $fHr, $redBrush, (New-Object System.Drawing.RectangleF 0, 52, 360, 60), $sf)
$gS.DrawString("BPM - ZONA 4 (UMBRAL)", $fSub, $grayBrush, (New-Object System.Drawing.RectangleF 0, 116, 360, 18), $sf)

# Metrics Grid
$gS.DrawString("4:45", $fVal, $whiteBrush, (New-Object System.Drawing.RectangleF 20, 146, 150, 35), $sf)
$gS.DrawString("RITMO /km", $fSub, $grayBrush, (New-Object System.Drawing.RectangleF 20, 182, 150, 18), $sf)

$gS.DrawString("178", $fVal, $whiteBrush, (New-Object System.Drawing.RectangleF 190, 146, 150, 35), $sf)
$gS.DrawString("CADENCIA spm", $fSub, $grayBrush, (New-Object System.Drawing.RectangleF 190, 182, 150, 18), $sf)

# Coach Tactical Order
$gS.FillRectangle($boxBrush, 20, 218, 320, 72)
$gS.DrawRectangle($boxPen, 20, 218, 320, 72)
$gS.DrawString("ORDEN DEL ENTRENADOR:", $fCoachT, $orangeBrush, (New-Object System.Drawing.RectangleF 30, 226, 300, 16), $sf)
$gS.DrawString("¡Excelente ritmo! Mantener.", $fCoachM, $whiteBrush, (New-Object System.Drawing.RectangleF 30, 250, 300, 24), $sf)

# Footer
$gS.DrawString("? VINCULADO AL RADAR DT", $fSub, $greenBrush, (New-Object System.Drawing.RectangleF 0, 316, 360, 20), $sf)

$pathS = Join-Path $storeDir "cuadrada_360x360.png"
$bmpS.Save($pathS, [System.Drawing.Imaging.ImageFormat]::Png)
$gS.Dispose()
$bmpS.Dispose()
Write-Host "Generated: $pathS"
