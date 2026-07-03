Add-Type -AssemblyName System.Drawing
$img="C:\Users\sandr\quenteebom-site\assets\img"
$enc=[System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders()|Where-Object{$_.MimeType -eq 'image/jpeg'}
$qp=New-Object System.Drawing.Imaging.EncoderParameters(1)
$qp.Param[0]=New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality,84L)
$b=[System.Drawing.Image]::FromFile("$img\equipa.png")
$sc=1700/$b.Width; $nw=1700; $nh=[int]($b.Height*$sc)
$o=New-Object System.Drawing.Bitmap($nw,$nh)
$g=[System.Drawing.Graphics]::FromImage($o); $g.InterpolationMode='HighQualityBicubic'; $g.DrawImage($b,0,0,$nw,$nh)
$o.Save("$img\equipa.jpg",$enc,$qp); $g.Dispose();$o.Dispose();$b.Dispose()
Remove-Item "$img\equipa.png" -Force
Write-Output "equipa.jpg OK"
