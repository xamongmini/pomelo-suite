param(
  [string]$Tag = "",
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

$workspaces = @(
  "@pomelo-suite/spangrid",
  "@pomelo-suite/calculator",
  "@pomelo-suite/scheduler",
  "@pomelo-suite/workqueue",
  "@pomelo-suite/runtime",
  "@pomelo-suite/color-picker",
  "@pomelo-suite/input",
  "@pomelo-suite/timeline",
  "@pomelo-suite/diagram"
)

if ($DryRun) {
  Write-Output "[DRY RUN] Publish order only:"
  $workspaces | ForEach-Object { Write-Output $_ }
  if ($Tag) {
    Write-Output ("[DRY RUN] Tag prefix: {0}" -f $Tag)
  }
  return
}

foreach ($workspace in $workspaces) {
  Write-Output ("Publishing {0} ..." -f $workspace)
  npm publish --workspace $workspace --access public
}

if ($Tag) {
  $pkgName = "pomelo-suite-packages-$Tag"
  Write-Output ("Tagging {0} ..." -f $pkgName)
  git tag $pkgName
}
