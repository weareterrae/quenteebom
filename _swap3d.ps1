Add-Type -AssemblyName System.Drawing
$M="C:\Users\sandr\OneDrive\Quente e Bom Angola\03. Comercial\Marketing"
$P="C:\Users\sandr\quenteebom-site\assets\produtos"
$map=@(
  @("Padaria\3D - Clássico - Pão Simples.jpg","pao\pao-de-forma-simples.png"),
  @("Padaria\3D - Clássico - Pão Brioche.jpg","pao\pao-de-forma-brioche.png"),
  @("Padaria\3D - Clássico - Pão Integral.jpg","pao\pao-de-forma-integral.png"),
  @("Padaria\3D - Clássico - Pão Hamburguer.jpg","pao\pao-de-hamburguer.png"),
  @("Padaria\3D - Clássico - Pão Hot Dog.jpg","pao\pao-de-hot-dog.png"),
  @("Padaria\3D - Clássico - Pão de Leite.jpg","pao\pao-de-leite.png"),
  @("Padaria\3D - Clássico - Pão de Leite Mini.jpg","pao\mini-pao-de-leite.png"),
  @("Padaria\3D - Bem Estar - Pão Fibra.jpg","pao\pao-de-forma-multicereais.png"),
  @("Padaria\3D - Bem Estar - Pão Multicereais.jpg","pao\pao-de-forma-boa-linha.png"),
  @("Padaria\3D - Tradicional - Pão Rustico.jpg","pao\pao-de-forma-rustico.png"),
  @("Cakes\3D - Cake Ananas.png","cakes\cake-ananas.png"),
  @("Cakes\3D - Cake Caramelo.png","cakes\cake-caramelo.png"),
  @("Cakes\3D - Cake Cenoura.png","cakes\cake-cenoura.png"),
  @("Cakes\3D - Cake Chocolate.png","cakes\cake-chocolate.png"),
  @("Cakes\3D - Cake Iogurte.png","cakes\cake-yogurte.png"),
  @("Cakes\3D - Cake Laranja.png","cakes\cake-laranja.png"),
  @("Cakes\3D - Cake Red Velvet.png","cakes\cake-red-velvet.png"),
  @("Cakes\3D - Pão de Ló Chocolate.png","cakes\pao-de-lo-chocolate.png"),
  @("Cakes\3D - Pão de Ló.png","cakes\pao-de-lo-tradicional.png"),
  @("Ingredientes\3D - Açúcar.png","ingredientes\acucar-em-po.png"),
  @("Ingredientes\3D - Amendoa Laminada.png","ingredientes\amendoa-laminada.png"),
  @("Ingredientes\3D - Amendoa Palitada.png","ingredientes\amendoa-palitada.png"),
  @("Ingredientes\3D - Amendoa sem Pele.png","ingredientes\amendoa-sem-pele.png"),
  @("Ingredientes\3D - Amido de Milho.png","ingredientes\amido-de-milho.png"),
  @("Ingredientes\3D - Cacau em Pó.png","ingredientes\cacau-em-po.png"),
  @("Ingredientes\3D - Caju.png","ingredientes\caju.png"),
  @("Ingredientes\3D - Chantilly.png","ingredientes\chantilly-em-po.png"),
  @("Ingredientes\3D - Chocolate Negro.png","ingredientes\chocolate-negro.png"),
  @("Ingredientes\3D - Chocolate de Leite.png","ingredientes\chocolate-de-leite.png"),
  @("Ingredientes\3D - Coco Ralado.png","ingredientes\coco-ralado.png"),
  @("Ingredientes\3D - Creme de Pasteleiro.png","ingredientes\creme-de-pasteleiro.png"),
  @("Ingredientes\3D - Fermento em Po.png","ingredientes\fermento-em-po.png"),
  @("Ingredientes\3D - Granulado de Chocolate.png","ingredientes\granulado-de-chocolate.png"),
  @("Ingredientes\3D - Nozes.png","ingredientes\nozes.png"),
  @("Ingredientes\3D - Sementes de Sesamo.png","ingredientes\sementes-de-sesamo.png"),
  @("Ingredientes\3D - Sultanas.png","ingredientes\sultanas.png")
)
$n=0
foreach($pair in $map){
  $src=Join-Path $M $pair[0]; $dst=Join-Path $P $pair[1]
  if(!(Test-Path $src)){ Write-Output ("FALTA: "+$pair[0]); continue }
  $b=[System.Drawing.Image]::FromFile($src)
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
  $n++
}
Write-Output "substituidos: $n de $($map.Count)"
