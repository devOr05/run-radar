Add-Type -AssemblyName System.Drawing

$storeDir = "C:\Users\kavay\.gemini\antigravity\scratch\run-radar\zepp-os-app\store_assets"
if (!(Test-Path $storeDir)) {
    New-Item -ItemType Directory -Path $storeDir | Out-Null
}

$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center

# --- SCREEN 1: 360x360 TELEMETRÍA EN VIVO ---
$bmp1 = New-Object System.Drawing.Bitmap 360, 360
$g1 = [System.Drawing.Graphics]::FromImage($bmp1)
$g1.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g1.Clear([System.Drawing.Color]::FromArgb(255, 10, 15, 29))

# Ring
$ringPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(140, 6, 182, 212), 3)
$g1.DrawEllipse($ringPen, 8, 8, 344, 344)

# Header
$fTitle = New-Object System.Drawing.Font ("Arial", 11, [System.Drawing.FontStyle]::Bold)
$cBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 6, 182, 212))
$g1.DrawString("RUNRADAR LIVE", $fTitle, $cBrush, (New-Object System.Drawing.RectangleF 0, 30, 360, 22), $sf)

# Heart rate
$fHr = New-Object System.Drawing.Font ("Arial", 50, [System.Drawing.FontStyle]::Bold)
$redBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 239, 68, 68))
$g1.DrawString("164", $fHr, $redBrush, (New-Object System.Drawing.RectangleF 0, 65, 360, 60), $sf)

$fSub = New-Object System.Drawing.Font ("Arial", 10, [System.Drawing.FontStyle]::Bold)
$grayBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 148, 163, 184))
$g1.DrawString("PULSO BPM (ZONA 4)", $fSub, $grayBrush, (New-Object System.Drawing.RectangleF 0, 130, 360, 18), $sf)

# Metrics Grid
$fVal = New-Object System.Drawing.Font ("Arial", 28, [System.Drawing.FontStyle]::Bold)
$whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
$g1.DrawString("4:45", $fVal, $whiteBrush, (New-Object System.Drawing.RectangleF 30, 160, 140, 35), $sf)
$g1.DrawString("RITMO /km", $fSub, $grayBrush, (New-Object System.Drawing.RectangleF 30, 198, 140, 18), $sf)

$g1.DrawString("178", $fVal, $whiteBrush, (New-Object System.Drawing.RectangleF 190, 160, 140, 35), $sf)
$g1.DrawString("CADENCIA spm", $fSub, $grayBrush, (New-Object System.Drawing.RectangleF 190, 198, 140, 18), $sf)

# Coach mini banner
$boxBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(220, 24, 33, 47))
$g1.FillRectangle($boxBrush, 35, 230, 290, 60)
$boxPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 249, 115, 22), 2)
$g1.DrawRectangle($boxPen, 35, 230, 290, 60)

$fCoachT = New-Object System.Drawing.Font ("Arial", 9, [System.Drawing.FontStyle]::Bold)
$orangeBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 249, 115, 22))
$g1.DrawString("ORDEN DEL ENTRENADOR:", $fCoachT, $orangeBrush, (New-Object System.Drawing.RectangleF 40, 236, 280, 16), $sf)

$fCoachM = New-Object System.Drawing.Font ("Arial", 11, [System.Drawing.FontStyle]::Bold)
$g1.DrawString("Mantener ritmo parejo", $fCoachM, $whiteBrush, (New-Object System.Drawing.RectangleF 40, 256, 280, 22), $sf)

$greenBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 34, 197, 94))
$g1.DrawString("? VINCULADO AL DT", $fSub, $greenBrush, (New-Object System.Drawing.RectangleF 0, 305, 360, 20), $sf)

$path1 = Join-Path $storeDir "screenshot_1_360x360.png"
$bmp1.Save($path1, [System.Drawing.Imaging.ImageFormat]::Png)
$g1.Dispose()
$bmp1.Dispose()
Write-Host "Generated screenshot 1: $path1"


# --- SCREEN 2: 360x360 ORDEN TÁCTICA CON VIBRACIÓN ---
$bmp2 = New-Object System.Drawing.Bitmap 360, 360
$g2 = [System.Drawing.Graphics]::FromImage($bmp2)
$g2.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g2.Clear([System.Drawing.Color]::FromArgb(255, 15, 23, 42))

$g2.DrawEllipse($ringPen, 8, 8, 344, 344)

$g2.DrawString("ALERTA TÁCTICA", $fTitle, $orangeBrush, (New-Object System.Drawing.RectangleF 0, 35, 360, 22), $sf)

# Big warning card
$alertBg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(240, 67, 20, 7))
$g2.FillRectangle($alertBg, 30, 80, 300, 150)
$alertPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 239, 68, 68), 2)
$g2.DrawRectangle($alertPen, 30, 80, 300, 150)

$fAlertIcon = New-Object System.Drawing.Font ("Arial", 20, [System.Drawing.FontStyle]::Bold)
$g2.DrawString("VIBRACIÓN", $fAlertIcon, $redBrush, (New-Object System.Drawing.RectangleF 30, 95, 300, 30), $sf)

$fAlertMsg = New-Object System.Drawing.Font ("Arial", 13, [System.Drawing.FontStyle]::Bold)
$g2.DrawString("Baja 15s/km! Venis en Zona 5", $fAlertMsg, $whiteBrush, (New-Object System.Drawing.RectangleF 40, 135, 280, 45), $sf)

$g2.DrawString("Instrucción del DT", $fSub, $grayBrush, (New-Object System.Drawing.RectangleF 30, 190, 300, 20), $sf)

# Status
$g2.DrawString("FC ACTUAL: 182 BPM", $fSub, $redBrush, (New-Object System.Drawing.RectangleF 0, 255, 360, 20), $sf)
$g2.DrawString("Toca la pantalla para confirmar", $fSub, $grayBrush, (New-Object System.Drawing.RectangleF 0, 285, 360, 20), $sf)

$path2 = Join-Path $storeDir "screenshot_2_360x360.png"
$bmp2.Save($path2, [System.Drawing.Imaging.ImageFormat]::Png)
$g2.Dispose()
$bmp2.Dispose()
Write-Host "Generated screenshot 2: $path2"


# --- SCREEN 3: 360x360 RESUMEN Y SINCRONIZACIÓN ---
$bmp3 = New-Object System.Drawing.Bitmap 360, 360
$g3 = [System.Drawing.Graphics]::FromImage($bmp3)
$g3.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g3.Clear([System.Drawing.Color]::FromArgb(255, 10, 15, 29))

$g3.DrawEllipse($ringPen, 8, 8, 344, 344)

$g3.DrawString("GRUPO RUNRADAR", $fTitle, $cBrush, (New-Object System.Drawing.RectangleF 0, 40, 360, 22), $sf)

$fBigGroup = New-Object System.Drawing.Font ("Arial", 20, [System.Drawing.FontStyle]::Bold)
$g3.DrawString("MARATÓN 2026", $fBigGroup, $whiteBrush, (New-Object System.Drawing.RectangleF 0, 75, 360, 30), $sf)

$fDesc = New-Object System.Drawing.Font ("Arial", 11, [System.Drawing.FontStyle]::Regular)
$g3.DrawString("Monitoreo activo en vivo", $fDesc, $grayBrush, (New-Object System.Drawing.RectangleF 0, 110, 360, 20), $sf)

$fStatN = New-Object System.Drawing.Font ("Arial", 20, [System.Drawing.FontStyle]::Bold)
$g3.DrawString("12.4 km", $fStatN, $whiteBrush, (New-Object System.Drawing.RectangleF 30, 150, 140, 30), $sf)
$g3.DrawString("DISTANCIA", $fSub, $grayBrush, (New-Object System.Drawing.RectangleF 30, 185, 140, 20), $sf)

$g3.DrawString("58:20", $fStatN, $whiteBrush, (New-Object System.Drawing.RectangleF 190, 150, 140, 30), $sf)
$g3.DrawString("TIEMPO", $fSub, $grayBrush, (New-Object System.Drawing.RectangleF 190, 185, 140, 20), $sf)

$g3.DrawString("Sincronizado con RunRadar Web", $fSub, $greenBrush, (New-Object System.Drawing.RectangleF 0, 240, 360, 20), $sf)
$g3.DrawString("Bip 5 - Bip 6 - Active - Balance", $fSub, $grayBrush, (New-Object System.Drawing.RectangleF 0, 270, 360, 20), $sf)

$path3 = Join-Path $storeDir "screenshot_3_360x360.png"
$bmp3.Save($path3, [System.Drawing.Imaging.ImageFormat]::Png)
$g3.Dispose()
$bmp3.Dispose()
Write-Host "Generated screenshot 3: $path3"
