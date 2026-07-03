Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$src="C:\Users\sandr\quenteebom-site"
$dstDir="C:\Users\sandr\netlify-deploy"
if(!(Test-Path $dstDir)){New-Item -ItemType Directory -Path $dstDir | Out-Null}
$dst=Join-Path $dstDir "quenteebom-site.zip"
if(Test-Path $dst){Remove-Item $dst -Force}
$zip=[System.IO.Compression.ZipFile]::Open($dst,'Create')
$gitDir=Join-Path $src ".git"
$files=Get-ChildItem $src -Recurse -File | Where-Object { -not $_.FullName.StartsWith($gitDir) -and -not $_.Name.StartsWith("_") }
$n=0
foreach($f in $files){
  $rel=$f.FullName.Substring($src.Length+1).Replace([char]92,[char]47)
  [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,$f.FullName,$rel) | Out-Null
  $n++
}
$zip.Dispose()
Write-Output ("zip: {0} ficheiros, {1:N1} MB" -f $n, ((Get-Item $dst).Length/1MB))
