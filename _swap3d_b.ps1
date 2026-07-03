Add-Type -AssemblyName System.Drawing
$M="C:\Users\sandr\OneDrive\Quente e Bom Angola\03. Comercial\Marketing"
$P="C:\Users\sandr\quenteebom-site\assets\produtos"
$map=@(
  @("Padaria","3D - Cl*ssico - P*o Simples.jpg","pao\pao-de-forma-simples.png"),
  @("Padaria","3D - Cl*ssico - P*o Brioche.jpg","pao\pao-de-forma-brioche.png"),
  @("Padaria","3D - Cl*ssico - P*o Integral.jpg","pao\pao-de-forma-integral.png"),
  @("Padaria","3D - Cl*ssico - P*o Hamburguer.jpg","pao\pao-de-hamburguer.png"),
  @("Padaria","3D - Cl*ssico - P*o Hot Dog.jpg","pao\pao-de-hot-dog.png"),
  @("Padaria","3D - Cl*ssico - P*o de Leite.jpg","pao\pao-de-leite.png"),
  @("Padaria","3D - Cl*ssico - P*o de Leite Mini.jpg","pao\mini-pao-de-leite.png"),
  @("Padaria","3D - Bem Estar - P*o Fibra.jpg","pao\pao-de-forma-multicereais.png"),
  @("Padaria","3D - Bem Estar - P*o Multicereais.jpg","pao\pao-de-forma-boa-linha.png"),
  @("Padaria","3D - Tradicional - P*o Rustico.jpg","pao\pao-de-forma-rustico.png"),
  @("Cakes","3D - P*o de L* Chocolate.png","cakes\pao-de-lo-chocolate.png"),
  @("Cakes","3D - P*o de L*.png","cakes\pao-de-lo-tradicional.png"),
  @("Ingredientes","3D - A*car.png","ingredientes\acucar-em-po.png"),
  @("Ingredientes","3D - Cacau em P*.png","ingredientes\cacau-em-po.png")
)
$n=0
foreach($t in $map){
  $cand=Get-ChildItem -Path (Join-Path $M $t[0]) -Filter $t[1] | Where-Object { $_.Name -notmatch 'Mini' -or $t[1] -match 'Mini' } 
  if($t[1] -eq "3D - P*o de L*.png"){ $cand=$cand | Where-Object { $_.Name -notmatch 'Chocolate' } }
  if($t[1] -eq "3D - Cl*ssico - P*o de Leite.jpg"){ $cand=$cand | Where-Object { $_.Name -notmatch 'Mini' } }
  $src=$cand | Select-Object -First 1
  if(-not $src){ Write-Output ("FALTA: "+$t[1]); continue }
  $dst=Join-Path $P $t[2]
  $b=[System.Drawing.Image]::FromFile($src.FullName)
  $sc=760/$b.Width; if($sc -gt 1){$sc=1}
  $nw=[int]($b.Width*$sc); $nh=[int]($b.Height*$sc)
  $o=New-Object System.Drawing.Bitmap($nw,$nh,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g=[System.Drawing.Graphics]::FromImage($o)
  $g.InterpolationMode='HighQualityBicubic'
  $g.DrawImage($b,0,0,$nw,$nh)
  $b.Dispose()
  $tmp="$dst.tmp"
  $o.Save($tmp,[System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose();$o.Dispose()
  Move-Item -Force $tmp $dst
  Write-Output ($src.Name+"  ->  "+$t[2])
  $n++
}
Write-Output "PASS2: $n de $($map.Count)"
