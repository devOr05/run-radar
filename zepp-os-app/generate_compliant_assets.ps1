Add-Type -AssemblyName System.Drawing

$root = "C:\Users\kavay\.gemini\antigravity\scratch\run-radar\zepp-os-app"
$storeDir = Join-Path $root "store_assets"
if (!(Test-Path $storeDir)) { New-Item -ItemType Directory -Force -Path $storeDir | Out-Null }

# =====================================================================
# 1. GENERATE ICONS (248x248 for Zepp OS 3.0 Design Guideline)
# =====================================================================
function Create-Circular-Icon($path, $dim) {
    $bmp = New-Object System.Drawing.Bitmap $dim, $dim
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)

    # Circular safe clip with 4px margin
    $margin = 4
    $diam = $dim - ($margin * 2)
    $circlePath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $circlePath.AddEllipse($margin, $margin, $diam, $diam)

    # Dark gradient background fill inside circle (not pure black to prevent blending)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (
        (New-Object System.Drawing.Point 0, 0),
        (New-Object System.Drawing.Point $dim, $dim),
        ([System.Drawing.Color]::FromArgb(255, 15, 23, 42)),
        ([System.Drawing.Color]::FromArgb(255, 10, 15, 30))
    )
    $g.FillPath($brush, $circlePath)

    # Cyan neon outer ring
    $penCyanBorder = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 0, 240, 255), 5)
    $g.DrawPath($penCyanBorder, $circlePath)

    # Concentric Radar rings
    $r1 = [Math]::Floor($dim * 0.28)
    $g.DrawEllipse((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(80, 0, 240, 255), 2)), ($dim/2 - $r1), ($dim/2 - $r1), ($r1*2), ($r1*2))

    $r2 = [Math]::Floor($dim * 0.18)
    $penDash = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(140, 0, 240, 255), 2)
    $penDash.DashPattern = [float[]](3.0, 3.0)
    $g.DrawEllipse($penDash, ($dim/2 - $r2), ($dim/2 - $r2), ($r2*2), ($r2*2))

    # Center Pulse Glow
    $coreR = [Math]::Floor($dim * 0.08)
    $glowR = [Math]::Floor($dim * 0.12)
    $g.FillEllipse((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(70, 0, 240, 255))), ($dim/2 - $glowR), ($dim/2 - $glowR), ($glowR*2), ($glowR*2))
    $coreBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (
        (New-Object System.Drawing.Point ($dim/2 - $coreR), ($dim/2 - $coreR)),
        (New-Object System.Drawing.Point ($dim/2 + $coreR), ($dim/2 + $coreR)),
        ([System.Drawing.Color]::FromArgb(255, 0, 240, 255)),
        ([System.Drawing.Color]::FromArgb(255, 59, 130, 246))
    )
    $g.FillEllipse($coreBrush, ($dim/2 - $coreR), ($dim/2 - $coreR), ($coreR*2), ($coreR*2))

    # Signal dot
    $sigR = [Math]::Floor($dim * 0.035)
    $sigX = [Math]::Floor($dim * 0.68)
    $sigY = [Math]::Floor($dim * 0.28)
    $g.FillEllipse((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 16, 185, 129))), $sigX, $sigY, ($sigR*2), ($sigR*2))

    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Created circular icon: $path"
}

Create-Circular-Icon (Join-Path $root "icon.png") 248
Create-Circular-Icon (Join-Path $root "assets\icon.png") 248
Create-Circular-Icon (Join-Path $root "assets\common.r\icon.png") 248
Create-Circular-Icon (Join-Path $root "assets\common.s\icon.png") 248
Create-Circular-Icon (Join-Path $storeDir "icon_240x240.png") 248

# =====================================================================
# 2. GENERATE ROUND PREVIEWS (360x360 with transparent corners)
# =====================================================================
function Create-Round-Preview($path, $type) {
    $dim = 360
    $bmp = New-Object System.Drawing.Bitmap $dim, $dim
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)

    # Circular mask strictly filling device display
    $margin = 2
    $diam = $dim - ($margin * 2)
    $circlePath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $circlePath.AddEllipse($margin, $margin, $diam, $diam)
    $g.SetClip($circlePath)

    # Background
    $bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 11, 15, 25))
    $g.FillRectangle($bgBrush, 0, 0, $dim, $dim)

    # Brushes & Fonts
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

    $fTitle = New-Object System.Drawing.Font ("Arial", 11, [System.Drawing.FontStyle]::Bold)
    $fHr = New-Object System.Drawing.Font ("Arial", 50, [System.Drawing.FontStyle]::Bold)
    $fSub = New-Object System.Drawing.Font ("Arial", 10, [System.Drawing.FontStyle]::Bold)
    $fVal = New-Object System.Drawing.Font ("Arial", 26, [System.Drawing.FontStyle]::Bold)
    $fCoachT = New-Object System.Drawing.Font ("Arial", 9, [System.Drawing.FontStyle]::Bold)
    $fCoachM = New-Object System.Drawing.Font ("Arial", 11, [System.Drawing.FontStyle]::Bold)

    $cyan = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 0, 240, 255))
    $red = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 239, 68, 68))
    $white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    $gray = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 148, 163, 184))
    $orange = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 249, 115, 22))
    $green = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 34, 197, 94))

    if ($type -eq "telemetry") {
        $g.DrawString("RUNRADAR TELEMETRY", $fTitle, $cyan, (New-Object System.Drawing.RectangleF 0, 32, $dim, 22), $sf)
        $g.DrawString("164", $fHr, $red, (New-Object System.Drawing.RectangleF 0, 62, $dim, 60), $sf)
        $g.DrawString("BPM - ZONA 4 (UMBRAL)", $fSub, $gray, (New-Object System.Drawing.RectangleF 0, 126, $dim, 18), $sf)

        $g.DrawString("4:45", $fVal, $white, (New-Object System.Drawing.RectangleF 30, 154, 140, 35), $sf)
        $g.DrawString("RITMO /km", $fSub, $gray, (New-Object System.Drawing.RectangleF 30, 190, 140, 18), $sf)

        $g.DrawString("178", $fVal, $white, (New-Object System.Drawing.RectangleF 190, 154, 140, 35), $sf)
        $g.DrawString("CADENCIA spm", $fSub, $gray, (New-Object System.Drawing.RectangleF 190, 190, 140, 18), $sf)

        $boxBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(220, 24, 33, 47))
        $g.FillRectangle($boxBrush, 40, 222, 280, 58)
        $g.DrawRectangle((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 249, 115, 22), 2)), 40, 222, 280, 58)
        $g.DrawString("ORDEN DEL ENTRENADOR:", $fCoachT, $orange, (New-Object System.Drawing.RectangleF 45, 228, 270, 16), $sf)
        $g.DrawString("Mantener ritmo parejo", $fCoachM, $white, (New-Object System.Drawing.RectangleF 45, 248, 270, 22), $sf)

        $g.DrawString("● VINCULADO AL PELOTON", $fSub, $green, (New-Object System.Drawing.RectangleF 0, 305, $dim, 20), $sf)
    } elseif ($type -eq "alert") {
        $g.DrawString("ALERTA TACTICA", $fTitle, $orange, (New-Object System.Drawing.RectangleF 0, 36, $dim, 22), $sf)
        $alertBg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(240, 67, 20, 7))
        $g.FillRectangle($alertBg, 35, 75, 290, 150)
        $g.DrawRectangle((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 239, 68, 68), 2)), 35, 75, 290, 150)

        $fAlertH = New-Object System.Drawing.Font ("Arial", 18, [System.Drawing.FontStyle]::Bold)
        $g.DrawString("VIBRACION", $fAlertH, $red, (New-Object System.Drawing.RectangleF 35, 90, 290, 28), $sf)
        $fAlertM = New-Object System.Drawing.Font ("Arial", 13, [System.Drawing.FontStyle]::Bold)
        $g.DrawString("Baja 15 seg/km! Pulso alto", $fAlertM, $white, (New-Object System.Drawing.RectangleF 45, 126, 270, 40), $sf)
        $g.DrawString("Instruccion en vivo del DT", $fSub, $gray, (New-Object System.Drawing.RectangleF 35, 178, 290, 20), $sf)

        $g.DrawString("FC ACTUAL: 182 BPM", $fSub, $red, (New-Object System.Drawing.RectangleF 0, 250, $dim, 20), $sf)
        $g.DrawString("Toca la pantalla para confirmar", $fSub, $gray, (New-Object System.Drawing.RectangleF 0, 282, $dim, 20), $sf)
    } else {
        $g.DrawString("RESUMEN DE CARRERA", $fTitle, $cyan, (New-Object System.Drawing.RectangleF 0, 34, $dim, 22), $sf)
        $fStatN = New-Object System.Drawing.Font ("Arial", 22, [System.Drawing.FontStyle]::Bold)
        $g.DrawString("12.4 km", $fStatN, $white, (New-Object System.Drawing.RectangleF 40, 75, 130, 32), $sf)
        $g.DrawString("DISTANCIA", $fSub, $gray, (New-Object System.Drawing.RectangleF 40, 107, 130, 18), $sf)

        $g.DrawString("58:20", $fStatN, $white, (New-Object System.Drawing.RectangleF 190, 75, 130, 32), $sf)
        $g.DrawString("TIEMPO", $fSub, $gray, (New-Object System.Drawing.RectangleF 190, 107, 130, 18), $sf)

        $g.DrawString("4:42", $fStatN, $cyan, (New-Object System.Drawing.RectangleF 40, 140, 130, 32), $sf)
        $g.DrawString("RITMO MEDIO", $fSub, $gray, (New-Object System.Drawing.RectangleF 40, 172, 130, 18), $sf)

        $g.DrawString("745 kcal", $fStatN, $white, (New-Object System.Drawing.RectangleF 190, 140, 130, 32), $sf)
        $g.DrawString("CALORIAS", $fSub, $gray, (New-Object System.Drawing.RectangleF 190, 172, 130, 18), $sf)

        $syncBox = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(200, 20, 83, 45))
        $g.FillRectangle($syncBox, 40, 215, 280, 50)
        $g.DrawRectangle((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 34, 197, 94), 1)), 40, 215, 280, 50)
        $g.DrawString("● AUTO-SINCRONIZADO AL DT", $fSub, $green, (New-Object System.Drawing.RectangleF 40, 230, 280, 22), $sf)

        $g.DrawString("Compatible con Zepp OS 3.0", $fSub, $gray, (New-Object System.Drawing.RectangleF 0, 298, $dim, 20), $sf)
    }

    $g.ResetClip()
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Created round preview: $path"
}

Create-Round-Preview (Join-Path $storeDir "redonda_1_360x360.png") "telemetry"
Create-Round-Preview (Join-Path $storeDir "redonda_2_360x360.png") "alert"
Create-Round-Preview (Join-Path $storeDir "redonda_3_360x360.png") "stats"

# =====================================================================
# 3. GENERATE SQUARE/RECTANGULAR PREVIEWS (Exact Zepp Guidelines)
# 360x360 px Canvas, 100% transparent background,
# Equal margins left/right, 0 margin top/bottom (Height = 360px, Width = 300px)
# =====================================================================
function Create-Square-Preview($path, $type) {
    $dim = 360
    $bmp = New-Object System.Drawing.Bitmap $dim, $dim
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)

    # Exact rectangular watch display proportions:
    # Width: 300px, Height: 360px (Margin X = 30px, Margin Y = 0)
    $sw = 300
    $sh = 360
    $sx = 30
    $sy = 0
    $r = 44 # Corner radius for Amazfit square/rectangular watches

    $rectPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $rectPath.AddArc($sx, $sy, $r*2, $r*2, 180, 90)
    $rectPath.AddArc(($sx + $sw - $r*2), $sy, $r*2, $r*2, 270, 90)
    $rectPath.AddArc(($sx + $sw - $r*2), ($sy + $sh - $r*2), $r*2, $r*2, 0, 90)
    $rectPath.AddArc($sx, ($sy + $sh - $r*2), $r*2, $r*2, 90, 90)
    $rectPath.CloseFigure()

    # Clip to watch screen so left/right margins and corners stay 100% transparent
    $g.SetClip($rectPath)

    # Background of device screen
    $bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 15, 23, 42))
    $g.FillRectangle($bgBrush, $sx, $sy, $sw, $sh)

    # Header bar
    $topBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 30, 41, 59))
    $g.FillRectangle($topBrush, $sx, $sy, $sw, 44)

    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

    $fTitle = New-Object System.Drawing.Font ("Arial", 11, [System.Drawing.FontStyle]::Bold)
    $fHr = New-Object System.Drawing.Font ("Arial", 50, [System.Drawing.FontStyle]::Bold)
    $fSub = New-Object System.Drawing.Font ("Arial", 10, [System.Drawing.FontStyle]::Bold)
    $fVal = New-Object System.Drawing.Font ("Arial", 28, [System.Drawing.FontStyle]::Bold)
    $fCoachT = New-Object System.Drawing.Font ("Arial", 9, [System.Drawing.FontStyle]::Bold)
    $fCoachM = New-Object System.Drawing.Font ("Arial", 11, [System.Drawing.FontStyle]::Bold)

    $cyan = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 0, 240, 255))
    $red = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 239, 68, 68))
    $white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    $gray = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 148, 163, 184))
    $orange = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 249, 115, 22))
    $green = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 34, 197, 94))

    if ($type -eq "telemetry") {
        $g.DrawString("RUNRADAR LIVE", $fTitle, $cyan, (New-Object System.Drawing.RectangleF $sx, 12, $sw, 24), $sf)
        $g.DrawString("164", $fHr, $red, (New-Object System.Drawing.RectangleF $sx, 56, $sw, 60), $sf)
        $g.DrawString("BPM - ZONA 4 (UMBRAL)", $fSub, $gray, (New-Object System.Drawing.RectangleF $sx, 118, $sw, 18), $sf)

        $g.DrawString("4:45", $fVal, $white, (New-Object System.Drawing.RectangleF ($sx + 10), 148, 135, 35), $sf)
        $g.DrawString("RITMO /km", $fSub, $gray, (New-Object System.Drawing.RectangleF ($sx + 10), 184, 135, 18), $sf)

        $g.DrawString("178", $fVal, $white, (New-Object System.Drawing.RectangleF ($sx + 155), 148, 135, 35), $sf)
        $g.DrawString("CADENCIA spm", $fSub, $gray, (New-Object System.Drawing.RectangleF ($sx + 155), 184, 135, 18), $sf)

        $boxBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(220, 24, 33, 47))
        $g.FillRectangle($boxBrush, ($sx + 15), 220, ($sw - 30), 72)
        $g.DrawRectangle((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 249, 115, 22), 2)), ($sx + 15), 220, ($sw - 30), 72)
        $g.DrawString("ORDEN DEL ENTRENADOR:", $fCoachT, $orange, (New-Object System.Drawing.RectangleF ($sx + 20), 228, ($sw - 40), 16), $sf)
        $g.DrawString("Mantener ritmo parejo", $fCoachM, $white, (New-Object System.Drawing.RectangleF ($sx + 20), 252, ($sw - 40), 24), $sf)

        $g.DrawString("● VINCULADO AL PELOTON", $fSub, $green, (New-Object System.Drawing.RectangleF $sx, 318, $sw, 20), $sf)
    } elseif ($type -eq "alert") {
        $g.DrawString("ORDEN DEL ENTRENADOR", $fTitle, $orange, (New-Object System.Drawing.RectangleF $sx, 12, $sw, 24), $sf)
        $alertBg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(240, 67, 20, 7))
        $g.FillRectangle($alertBg, ($sx + 15), 60, ($sw - 30), 150)
        $g.DrawRectangle((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 239, 68, 68), 2)), ($sx + 15), 60, ($sw - 30), 150)

        $fAlertH = New-Object System.Drawing.Font ("Arial", 16, [System.Drawing.FontStyle]::Bold)
        $g.DrawString("VIBRACION EN EL RELOJ", $fAlertH, $red, (New-Object System.Drawing.RectangleF ($sx + 15), 74, ($sw - 30), 28), $sf)
        $fAlertM = New-Object System.Drawing.Font ("Arial", 13, [System.Drawing.FontStyle]::Bold)
        $g.DrawString("Baja 15 seg/km! Pulso muy alto", $fAlertM, $white, (New-Object System.Drawing.RectangleF ($sx + 20), 114, ($sw - 40), 42), $sf)
        $g.DrawString("Instruccion enviada por el DT", $fSub, $gray, (New-Object System.Drawing.RectangleF ($sx + 15), 168, ($sw - 30), 20), $sf)

        $g.DrawString("FC ACTUAL: 184 BPM (ZONA 5)", $fSub, $red, (New-Object System.Drawing.RectangleF $sx, 232, $sw, 22), $sf)
        $g.DrawString("RITMO: 4:18 min/km", $fVal, $white, (New-Object System.Drawing.RectangleF $sx, 258, $sw, 36), $sf)
        $g.DrawString("Toca la pantalla para confirmar", $fSub, $gray, (New-Object System.Drawing.RectangleF $sx, 316, $sw, 20), $sf)
    } else {
        $g.DrawString("RUNRADAR TELEMETRY", $fTitle, $cyan, (New-Object System.Drawing.RectangleF $sx, 12, $sw, 24), $sf)
        $fGroup = New-Object System.Drawing.Font ("Arial", 15, [System.Drawing.FontStyle]::Bold)
        $g.DrawString("GRUPO: MARATON 2026", $fGroup, $white, (New-Object System.Drawing.RectangleF $sx, 56, $sw, 26), $sf)
        $g.DrawString("Atleta: Juan Perez #4 en Peloton", $fSub, $gray, (New-Object System.Drawing.RectangleF $sx, 86, $sw, 20), $sf)

        $fStatN = New-Object System.Drawing.Font ("Arial", 20, [System.Drawing.FontStyle]::Bold)
        $g.DrawString("12.4 km", $fStatN, $white, (New-Object System.Drawing.RectangleF ($sx + 10), 118, 135, 30), $sf)
        $g.DrawString("DISTANCIA", $fSub, $gray, (New-Object System.Drawing.RectangleF ($sx + 10), 150, 135, 18), $sf)

        $g.DrawString("58:20", $fStatN, $white, (New-Object System.Drawing.RectangleF ($sx + 155), 118, 135, 30), $sf)
        $g.DrawString("TIEMPO", $fSub, $gray, (New-Object System.Drawing.RectangleF ($sx + 155), 150, 135, 18), $sf)

        $g.DrawString("4:42", $fStatN, $cyan, (New-Object System.Drawing.RectangleF ($sx + 10), 182, 135, 30), $sf)
        $g.DrawString("RITMO MEDIO", $fSub, $gray, (New-Object System.Drawing.RectangleF ($sx + 10), 214, 135, 18), $sf)

        $g.DrawString("745 kcal", $fStatN, $white, (New-Object System.Drawing.RectangleF ($sx + 155), 182, 135, 30), $sf)
        $g.DrawString("CALORIAS", $fSub, $gray, (New-Object System.Drawing.RectangleF ($sx + 155), 214, 135, 18), $sf)

        $syncBox = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(200, 20, 83, 45))
        $g.FillRectangle($syncBox, ($sx + 15), 252, ($sw - 30), 48)
        $g.DrawRectangle((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 34, 197, 94), 1)), ($sx + 15), 252, ($sw - 30), 48)
        $g.DrawString("● SINCRONIZADO AL ENTRENADOR", $fSub, $green, (New-Object System.Drawing.RectangleF ($sx + 15), 265, ($sw - 30), 22), $sf)

        $g.DrawString("Compatible con Zepp OS 3.0", $fSub, $gray, (New-Object System.Drawing.RectangleF $sx, 320, $sw, 20), $sf)
    }

    $g.ResetClip()
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Created square preview: $path"
}

Create-Square-Preview (Join-Path $storeDir "cuadrada_1_360x360.png") "telemetry"
Create-Square-Preview (Join-Path $storeDir "cuadrada_2_360x360.png") "alert"
Create-Square-Preview (Join-Path $storeDir "cuadrada_3_360x360.png") "stats"
