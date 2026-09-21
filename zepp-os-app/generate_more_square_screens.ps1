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
$fHr = New-Object System.Drawing.Font ("Arial", 50, [System.Drawing.FontStyle]::Bold)
$fSub = New-Object System.Drawing.Font ("Arial", 10, [System.Drawing.FontStyle]::Bold)
$fVal = New-Object System.Drawing.Font ("Arial", 28, [System.Drawing.FontStyle]::Bold)
$fCoachT = New-Object System.Drawing.Font ("Arial", 9, [System.Drawing.FontStyle]::Bold)
$fCoachM = New-Object System.Drawing.Font ("Arial", 11, [System.Drawing.FontStyle]::Bold)

# Colors
$cyanBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 0, 240, 255))
$redBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 239, 68, 68))
$whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
$grayBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 148, 163, 184))
$orangeBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 249, 115, 22))
$greenBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 34, 197, 94))
$topBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 30, 41, 59))

# =========================================================================
# CUADRADA 2: ALERTA TÁCTICA Y VIBRACIÓN HÁPTICA
# =========================================================================
$bmp2 = New-Object System.Drawing.Bitmap 360, 360
$g2 = [System.Drawing.Graphics]::FromImage($bmp2)
$g2.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g2.Clear([System.Drawing.Color]::FromArgb(255, 15, 23, 42))

# Top Header
$g2.FillRectangle($topBrush, 0, 0, 360, 42)
$g2.DrawString("ORDEN DEL ENTRENADOR", $fTitle, $orangeBrush, (New-Object System.Drawing.RectangleF 0, 11, 360, 24), $sf)

# Alert box
$alertBg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(240, 67, 20, 7))
$g2.FillRectangle($alertBg, 20, 56, 320, 160)
$alertBorder = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 239, 68, 68), 2)
$g2.DrawRectangle($alertBorder, 20, 56, 320, 160)

$fBigAlert = New-Object System.Drawing.Font ("Arial", 18, [System.Drawing.FontStyle]::Bold)
$g2.DrawString("VIBRACIÓN DEL RELOJ", $fBigAlert, $redBrush, (New-Object System.Drawing.RectangleF 20, 70, 320, 28), $sf)

$fAlertMsg = New-Object System.Drawing.Font ("Arial", 14, [System.Drawing.FontStyle]::Bold)
$g2.DrawString("¡Baja 15 seg/km! Pulso muy alto", $fAlertMsg, $whiteBrush, (New-Object System.Drawing.RectangleF 30, 110, 300, 45), $sf)

$g2.DrawString("Instrucción enviada en vivo por el DT", $fSub, $grayBrush, (New-Object System.Drawing.RectangleF 20, 168, 320, 20), $sf)

# Heart Rate Warning
$g2.DrawString("FC ACTUAL: 184 BPM (ZONA 5)", $fSub, $redBrush, (New-Object System.Drawing.RectangleF 0, 235, 360, 22), $sf)
$g2.DrawString("RITMO: 4:18 min/km", $fVal, $whiteBrush, (New-Object System.Drawing.RectangleF 0, 260, 360, 36), $sf)

$g2.DrawString("Toca la pantalla para confirmar recepción", $fSub, $grayBrush, (New-Object System.Drawing.RectangleF 0, 316, 360, 20), $sf)

$path2 = Join-Path $storeDir "cuadrada_2_alerta_360x360.png"
$bmp2.Save($path2, [System.Drawing.Imaging.ImageFormat]::Png)
$g2.Dispose()
$bmp2.Dispose()
Write-Host "Generated: $path2"


# =========================================================================
# CUADRADA 3: RESUMEN DE CARRERA Y GRUPO
# =========================================================================
$bmp3 = New-Object System.Drawing.Bitmap 360, 360
$g3 = [System.Drawing.Graphics]::FromImage($bmp3)
$g3.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g3.Clear([System.Drawing.Color]::FromArgb(255, 10, 15, 29))

# Top Header
$g3.FillRectangle($topBrush, 0, 0, 360, 42)
$g3.DrawString("RUNRADAR TELEMETRY", $fTitle, $cyanBrush, (New-Object System.Drawing.RectangleF 0, 11, 360, 24), $sf)

$fGroup = New-Object System.Drawing.Font ("Arial", 18, [System.Drawing.FontStyle]::Bold)
$g3.DrawString("GRUPO: MARATÓN 2026", $fGroup, $whiteBrush, (New-Object System.Drawing.RectangleF 0, 56, 360, 28), $sf)
$g3.DrawString("Atleta: Juan Perez  #4 en Pelotón", $fSub, $grayBrush, (New-Object System.Drawing.RectangleF 0, 88, 360, 20), $sf)

# 4 Metrics Grid
$fStatN = New-Object System.Drawing.Font ("Arial", 22, [System.Drawing.FontStyle]::Bold)

# Metric 1: Distancia
$g3.DrawString("12.4 km", $fStatN, $whiteBrush, (New-Object System.Drawing.RectangleF 20, 120, 150, 30), $sf)
$g3.DrawString("DISTANCIA", $fSub, $grayBrush, (New-Object System.Drawing.RectangleF 20, 152, 150, 18), $sf)

# Metric 2: Tiempo
$g3.DrawString("58:20", $fStatN, $whiteBrush, (New-Object System.Drawing.RectangleF 190, 120, 150, 30), $sf)
$g3.DrawString("TIEMPO", $fSub, $grayBrush, (New-Object System.Drawing.RectangleF 190, 152, 150, 18), $sf)

# Metric 3: Ritmo Medio
$g3.DrawString("4:42", $fStatN, $cyanBrush, (New-Object System.Drawing.RectangleF 20, 185, 150, 30), $sf)
$g3.DrawString("RITMO MEDIO", $fSub, $grayBrush, (New-Object System.Drawing.RectangleF 20, 217, 150, 18), $sf)

# Metric 4: Calorias
$g3.DrawString("745 kcal", $fStatN, $whiteBrush, (New-Object System.Drawing.RectangleF 190, 185, 150, 30), $sf)
$g3.DrawString("CALORÍAS", $fSub, $grayBrush, (New-Object System.Drawing.RectangleF 190, 217, 150, 18), $sf)

# Sync Footer
$syncBox = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(200, 20, 83, 45))
$g3.FillRectangle($syncBox, 20, 255, 320, 50)
$syncPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 34, 197, 94), 1)
$g3.DrawRectangle($syncPen, 20, 255, 320, 50)
$g3.DrawString("? SINCRONIZADO CON RUNRADAR", $fSub, $greenBrush, (New-Object System.Drawing.RectangleF 20, 268, 320, 22), $sf)

$g3.DrawString("Compatible con Zepp OS 3.0", $fSub, $grayBrush, (New-Object System.Drawing.RectangleF 0, 320, 360, 20), $sf)

$path3 = Join-Path $storeDir "cuadrada_3_grupo_360x360.png"
$bmp3.Save($path3, [System.Drawing.Imaging.ImageFormat]::Png)
$g3.Dispose()
$bmp3.Dispose()
Write-Host "Generated: $path3"


# =========================================================================
# CUADRADA 4: ANÁLISIS DE CADENCIA Y BIOMECÁNICA
# =========================================================================
$bmp4 = New-Object System.Drawing.Bitmap 360, 360
$g4 = [System.Drawing.Graphics]::FromImage($bmp4)
$g4.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g4.Clear([System.Drawing.Color]::FromArgb(255, 15, 23, 42))

$g4.FillRectangle($topBrush, 0, 0, 360, 42)
$g4.DrawString("CADENCIA & BIOMECÁNICA", $fTitle, $cyanBrush, (New-Object System.Drawing.RectangleF 0, 11, 360, 24), $sf)

# Cadence Highlight
$g4.DrawString("182", $fHr, $greenBrush, (New-Object System.Drawing.RectangleF 0, 56, 360, 60), $sf)
$g4.DrawString("PASOS POR MINUTO (SPM) - ÓPTIMO", $fSub, $greenBrush, (New-Object System.Drawing.RectangleF 0, 120, 360, 20), $sf)

# Cadence Bar Indicator
$barBg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 51, 65, 85))
$g4.FillRectangle($barBg, 40, 150, 280, 14)
$barFill = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 34, 197, 94))
$g4.FillRectangle($barFill, 40, 150, 220, 14)

# Zone info
$g4.DrawString("Rango ideal de carrera: 175 - 185 SPM", $fSub, $grayBrush, (New-Object System.Drawing.RectangleF 0, 175, 360, 20), $sf)

# Coach feedback
$fBackBox = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(220, 30, 41, 59))
$g4.FillRectangle($fBackBox, 20, 210, 320, 80)
$g4.DrawRectangle((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 6, 182, 212), 2)), 20, 210, 320, 80)

$g4.DrawString("IA COPILOT / PROFESOR:", $fCoachT, $cyanBrush, (New-Object System.Drawing.RectangleF 30, 220, 300, 16), $sf)
$g4.DrawString("Excelente cadencia. Eficiencia alta.", $fCoachM, $whiteBrush, (New-Object System.Drawing.RectangleF 30, 245, 300, 30), $sf)

$g4.DrawString("? RUNRADAR LIVE TELEMETRY", $fSub, $greenBrush, (New-Object System.Drawing.RectangleF 0, 316, 360, 20), $sf)

$path4 = Join-Path $storeDir "cuadrada_4_cadencia_360x360.png"
$bmp4.Save($path4, [System.Drawing.Imaging.ImageFormat]::Png)
$g4.Dispose()
$bmp4.Dispose()
Write-Host "Generated: $path4"
