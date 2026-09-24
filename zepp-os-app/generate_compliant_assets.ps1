Add-Type -AssemblyName System.Drawing

$root = "C:\Users\kavay\.gemini\antigravity\scratch\run-radar\zepp-os-app"
$storeDir = Join-Path $root "store_assets"
if (!(Test-Path $storeDir)) { New-Item -ItemType Directory -Force -Path $storeDir | Out-Null }

function Create-Circular-Icon($path, $dim) {
    $bmp = New-Object System.Drawing.Bitmap $dim, $dim
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)

    # Safe circular clip
    $margin = [Math]::Max(2, [Math]::Floor($dim * 0.02))
    $diam = $dim - ($margin * 2)
    $rect = New-Object System.Drawing.Rectangle $margin, $margin, $diam, $diam
    $circlePath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $circlePath.AddEllipse($rect)

    # Dark background fill inside circle
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (
        (New-Object System.Drawing.Point 0, 0),
        (New-Object System.Drawing.Point $dim, $dim),
        ([System.Drawing.Color]::FromArgb(255, 11, 15, 25)),
        ([System.Drawing.Color]::FromArgb(255, 5, 8, 17))
    )
    $g.FillPath($brush, $circlePath)

    # Cyan border ring
    $penCyanBorder = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 0, 240, 255), [Math]::Max(2, [Math]::Floor($dim * 0.02)))
    $g.DrawPath($penCyanBorder, $circlePath)

    # Concentric Radar rings
    $r1 = [Math]::Floor($dim * 0.28)
    $g.DrawEllipse((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(70, 0, 240, 255), 2)), ($dim/2 - $r1), ($dim/2 - $r1), ($r1*2), ($r1*2))

    $r2 = [Math]::Floor($dim * 0.18)
    $penDash = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(120, 0, 240, 255), 2)
    $penDash.DashPattern = [float[]](3.0, 3.0)
    $g.DrawEllipse($penDash, ($dim/2 - $r2), ($dim/2 - $r2), ($r2*2), ($r2*2))

    # Center Pulse Glow
    $coreR = [Math]::Floor($dim * 0.08)
    $glowR = [Math]::Floor($dim * 0.12)
    $g.FillEllipse((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(60, 0, 240, 255))), ($dim/2 - $glowR), ($dim/2 - $glowR), ($glowR*2), ($glowR*2))
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

# 1. GENERAR ICONOS CIRCULARES
Create-Circular-Icon (Join-Path $root "icon.png") 240
Create-Circular-Icon (Join-Path $root "assets\icon.png") 240
Create-Circular-Icon (Join-Path $root "assets\common.r\icon.png") 240
Create-Circular-Icon (Join-Path $root "assets\common.s\icon.png") 240
Create-Circular-Icon (Join-Path $storeDir "icon_240x240.png") 240

# 2. GENERAR PREVIEW IMAGES REDONDAS (360x360 con 4 esquinas 100% transparentes)
function Create-Round-Preview($path, $isAlert) {
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

    # Set clip so NOTHING can draw outside the circle!
    $g.SetClip($circlePath)

    # Background
    $bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 11, 15, 25))
    $g.FillRectangle($bgBrush, 0, 0, $dim, $dim)

    # Content
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

    if (-not $isAlert) {
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

        $g.DrawString("? VINCULADO AL PELOTON", $fSub, $green, (New-Object System.Drawing.RectangleF 0, 305, $dim, 20), $sf)
    } else {
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
    }

    # Reset clip and save
    $g.ResetClip()
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Created round preview with transparent corners: $path"
}

Create-Round-Preview (Join-Path $storeDir "redonda_360x360.png") $false
Create-Round-Preview (Join-Path $storeDir "redonda_1_360x360.png") $false
Create-Round-Preview (Join-Path $storeDir "redonda_2_360x360.png") $true

# 3. GENERAR PREVIEW IMAGES CUADRADAS (360x360 con esquinas redondeadas y transparentes)
function Create-Square-Preview($path, $type) {
    $dim = 360
    $bmp = New-Object System.Drawing.Bitmap $dim, $dim
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)

    # Rounded rectangle path representing Amazfit square device display (radius 32px)
    $r = 32
    $rect = New-Object System.Drawing.Rectangle 0, 0, $dim, $dim
    $sqPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $sqPath.AddArc($rect.X, $rect.Y, $r*2, $r*2, 180, 90)
    $sqPath.AddArc($rect.Right - $r*2, $rect.Y, $r*2, $r*2, 270, 90)
    $sqPath.AddArc($rect.Right - $r*2, $rect.Bottom - $r*2, $r*2, $r*2, 0, 90)
    $sqPath.AddArc($rect.X, $rect.Bottom - $r*2, $r*2, $r*2, 90, 90)
    $sqPath.CloseFigure()

    $g.SetClip($sqPath)

    # Background
    $bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 15, 23, 42))
    $g.FillRectangle($bgBrush, 0, 0, $dim, $dim)

    # Header bar
    $topBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 30, 41, 59))
    $g.FillRectangle($topBrush, 0, 0, $dim, 44)

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
        $g.DrawString("RUNRADAR LIVE", $fTitle, $cyan, (New-Object System.Drawing.RectangleF 0, 12, $dim, 24), $sf)
        $g.DrawString("164", $fHr, $red, (New-Object System.Drawing.RectangleF 0, 56, $dim, 60), $sf)
        $g.DrawString("BPM - ZONA 4 (UMBRAL)", $fSub, $gray, (New-Object System.Drawing.RectangleF 0, 118, $dim, 18), $sf)

        $g.DrawString("4:45", $fVal, $white, (New-Object System.Drawing.RectangleF 20, 148, 150, 35), $sf)
        $g.DrawString("RITMO /km", $fSub, $gray, (New-Object System.Drawing.RectangleF 20, 184, 150, 18), $sf)

        $g.DrawString("178", $fVal, $white, (New-Object System.Drawing.RectangleF 190, 148, 150, 35), $sf)
        $g.DrawString("CADENCIA spm", $fSub, $gray, (New-Object System.Drawing.RectangleF 190, 184, 150, 18), $sf)

        $boxBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(220, 24, 33, 47))
        $g.FillRectangle($boxBrush, 20, 220, 320, 72)
        $g.DrawRectangle((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 249, 115, 22), 2)), 20, 220, 320, 72)
        $g.DrawString("ORDEN DEL ENTRENADOR:", $fCoachT, $orange, (New-Object System.Drawing.RectangleF 30, 228, 300, 16), $sf)
        $g.DrawString("Mantener ritmo parejo", $fCoachM, $white, (New-Object System.Drawing.RectangleF 30, 252, 300, 24), $sf)

        $g.DrawString("? VINCULADO AL PELOTON", $fSub, $green, (New-Object System.Drawing.RectangleF 0, 318, $dim, 20), $sf)
    } elseif ($type -eq "alert") {
        $g.DrawString("ORDEN DEL ENTRENADOR", $fTitle, $orange, (New-Object System.Drawing.RectangleF 0, 12, $dim, 24), $sf)
        $alertBg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(240, 67, 20, 7))
        $g.FillRectangle($alertBg, 20, 60, 320, 150)
        $g.DrawRectangle((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 239, 68, 68), 2)), 20, 60, 320, 150)

        $fAlertH = New-Object System.Drawing.Font ("Arial", 18, [System.Drawing.FontStyle]::Bold)
        $g.DrawString("VIBRACION EN EL RELOJ", $fAlertH, $red, (New-Object System.Drawing.RectangleF 20, 74, 320, 28), $sf)
        $fAlertM = New-Object System.Drawing.Font ("Arial", 14, [System.Drawing.FontStyle]::Bold)
        $g.DrawString("Baja 15 seg/km! Pulso muy alto", $fAlertM, $white, (New-Object System.Drawing.RectangleF 30, 114, 300, 42), $sf)
        $g.DrawString("Instruccion enviada en vivo por el DT", $fSub, $gray, (New-Object System.Drawing.RectangleF 20, 168, 320, 20), $sf)

        $g.DrawString("FC ACTUAL: 184 BPM (ZONA 5)", $fSub, $red, (New-Object System.Drawing.RectangleF 0, 232, $dim, 22), $sf)
        $g.DrawString("RITMO: 4:18 min/km", $fVal, $white, (New-Object System.Drawing.RectangleF 0, 258, $dim, 36), $sf)
        $g.DrawString("Toca la pantalla para confirmar", $fSub, $gray, (New-Object System.Drawing.RectangleF 0, 316, $dim, 20), $sf)
    } else {
        $g.DrawString("RUNRADAR TELEMETRY", $fTitle, $cyan, (New-Object System.Drawing.RectangleF 0, 12, $dim, 24), $sf)
        $fGroup = New-Object System.Drawing.Font ("Arial", 17, [System.Drawing.FontStyle]::Bold)
        $g.DrawString("GRUPO: MARATON 2026", $fGroup, $white, (New-Object System.Drawing.RectangleF 0, 56, $dim, 26), $sf)
        $g.DrawString("Atleta: Juan Perez  #4 en Peloton", $fSub, $gray, (New-Object System.Drawing.RectangleF 0, 86, $dim, 20), $sf)

        $fStatN = New-Object System.Drawing.Font ("Arial", 22, [System.Drawing.FontStyle]::Bold)
        $g.DrawString("12.4 km", $fStatN, $white, (New-Object System.Drawing.RectangleF 20, 118, 150, 30), $sf)
        $g.DrawString("DISTANCIA", $fSub, $gray, (New-Object System.Drawing.RectangleF 20, 150, 150, 18), $sf)

        $g.DrawString("58:20", $fStatN, $white, (New-Object System.Drawing.RectangleF 190, 118, 150, 30), $sf)
        $g.DrawString("TIEMPO", $fSub, $gray, (New-Object System.Drawing.RectangleF 190, 150, 150, 18), $sf)

        $g.DrawString("4:42", $fStatN, $cyan, (New-Object System.Drawing.RectangleF 20, 182, 150, 30), $sf)
        $g.DrawString("RITMO MEDIO", $fSub, $gray, (New-Object System.Drawing.RectangleF 20, 214, 150, 18), $sf)

        $g.DrawString("745 kcal", $fStatN, $white, (New-Object System.Drawing.RectangleF 190, 182, 150, 30), $sf)
        $g.DrawString("CALORIAS", $fSub, $gray, (New-Object System.Drawing.RectangleF 190, 214, 150, 18), $sf)

        $syncBox = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(200, 20, 83, 45))
        $g.FillRectangle($syncBox, 20, 252, 320, 48)
        $g.DrawRectangle((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 34, 197, 94), 1)), 20, 252, 320, 48)
        $g.DrawString("? SINCRONIZADO CON RUNRADAR", $fSub, $green, (New-Object System.Drawing.RectangleF 20, 265, 320, 22), $sf)

        $g.DrawString("Compatible con Zepp OS 3.0", $fSub, $gray, (New-Object System.Drawing.RectangleF 0, 320, $dim, 20), $sf)
    }

    $g.ResetClip()
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Created square preview with transparent rounded corners: $path"
}

Create-Square-Preview (Join-Path $storeDir "cuadrada_360x360.png") "telemetry"
Create-Square-Preview (Join-Path $storeDir "cuadrada_1_360x360.png") "telemetry"
Create-Square-Preview (Join-Path $storeDir "cuadrada_2_alerta_360x360.png") "alert"
Create-Square-Preview (Join-Path $storeDir "cuadrada_3_grupo_360x360.png") "stats"
