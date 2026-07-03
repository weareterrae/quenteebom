Add-Type -AssemblyName System.Drawing
$img="C:\Users\sandr\quenteebom-site\assets\img"
$enc=[System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders()|Where-Object{$_.MimeType -eq 'image/jpeg'}
$qp=New-Object System.Drawing.Imaging.EncoderParameters(1)
$qp.Param[0]=New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality,84L)
foreach($n in @('rec_ananas','rec_iogurtecoco','rec_paolorecheado','rec_brigadeiros','rec_salame','rec_crocante')){
  $b=[System.Drawing.Image]::FromFile("$img\$n.png")
  $o=New-Object System.Drawing.Bitmap($b.Width,$b.Height)
  $g=[System.Drawing.Graphics]::FromImage($o); $g.DrawImage($b,0,0,$b.Width,$b.Height)
  $o.Save("$img\$n.jpg",$enc,$qp); $g.Dispose();$o.Dispose();$b.Dispose()
  Remove-Item "$img\$n.png" -Force
  Write-Output "$n.jpg"
}
