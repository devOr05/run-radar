Add-Type -AssemblyName System.Drawing

$iconPath = "C:\Users\kavay\.gemini\antigravity\scratch\run-radar\zepp-os-app\store_assets\icon_240x240.png"

$size = 240
$bmp = New-Object System.Drawing.Bitmap $size, $size
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([System.Drawing.Color]::Transparent)

# Dark gradient background inside circle (cx=120, cy=120, r=118 to fill completely)
$circleRect = New-Object System.Drawing.Rectangle 1, 1, 238, 238
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddEllipse($circleRect)

$linGrBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (
    (New-Object System.Drawing.Point 0, 0),
    (New-Object System.Drawing.Point 240, 240),
    ([System.Drawing.Color]::FromArgb(255, 11, 15, 25)),  # #0B0F19
    ([System.Drawing.Color]::FromArgb(255, 5, 8, 17))     # #050811
)
$g.FillPath($linGrBrush, $path)

# Border ring
$borderPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 30, 41, 59), 3) # #1E293B
$g.DrawEllipse($borderPen, 1, 1, 238, 238)

# Concentric Radar Rings
# Outer ring (r=84)
$radarPen1 = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(70, 0, 240, 255), 2)
$g.DrawEllipse($radarPen1, 36, 36, 168, 168)

# Middle dashed ring (r=56)
$radarPen2 = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(110, 0, 240, 255), 2)
$radarPen2.DashPattern = [float[]](4.0, 4.0)
$g.DrawEllipse($radarPen2, 64, 64, 112, 112)

# Inner solid ring (r=28)
$radarPen3 = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(150, 0, 240, 255), 2)
$g.DrawEllipse($radarPen3, 92, 92, 56, 56)

# Running / Telemetry Curves (matching public/icon.svg)
# Cyan curve
$curvePenCyan = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(230, 0, 240, 255), 4)
$curvePenCyan.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$curvePenCyan.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$ptsCyan = @(
    (New-Object System.Drawing.Point 98, 75),
    (New-Object System.Drawing.Point 120, 56),
    (New-Object System.Drawing.Point 141, 80),
    (New-Object System.Drawing.Point 164, 117)
)
$g.DrawCurve($curvePenCyan, $ptsCyan, 0.5)

# Emerald green curve
$curvePenGreen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(230, 16, 185, 129), 4) # #10B981
$curvePenGreen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$curvePenGreen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$ptsGreen = @(
    (New-Object System.Drawing.Point 75, 126),
    (New-Object System.Drawing.Point 98, 108),
    (New-Object System.Drawing.Point 120, 120),
    (New-Object System.Drawing.Point 155, 164)
)
$g.DrawCurve($curvePenGreen, $ptsGreen, 0.5)

# Central Pulse Indicator with Glow
# Outer glow
$glowBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(60, 0, 240, 255))
$g.FillEllipse($glowBrush, 102, 102, 36, 36)

# Core pulse
$coreBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (
    (New-Object System.Drawing.Point 107, 107),
    (New-Object System.Drawing.Point 133, 133),
    ([System.Drawing.Color]::FromArgb(255, 0, 240, 255)),   # #00F0FF
    ([System.Drawing.Color]::FromArgb(255, 59, 130, 246))   # #3B82F6
)
$g.FillEllipse($coreBrush, 107, 107, 26, 26)

# Live Signal Ping Dot (Green) with glow at top right
$greenGlow = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(80, 16, 185, 129))
$g.FillEllipse($greenGlow, 156, 68, 18, 18)
$greenDot = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 16, 185, 129))
$g.FillEllipse($greenDot, 159, 71, 12, 12)

$bmp.Save($iconPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()

Write-Host "Successfully generated 240x240 circular icon matching mobile app: $iconPath"
