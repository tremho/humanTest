wpk=`which electron-packager`
wwn=`which wine64`
plt=`uname`

if [[ "$wpk" == "" ]]; then
  npm install -g electron-packager
fi

# Announce for debugging trail if needed
electron-packager --version

# make Mac
electron-packager . --overwrite --platform=darwin --arch=x64 --extraResource=../index.html --extraResource=../css --extraResource=../dist --icon=assets/icons/mac/icon.icns --prune=true --out=release-builds

# make Windows
echo "Making mac package"
if [[ "$wwn" == "" ]]; then
  echo "Not creating Windows app -- wine64 is not available. Daddy Needs Wine!"
else
  electron-packager . HumanTest --overwrite --asar --platform=win32 --arch=ia32  --extraResource=../index.html --extraResource=../css --extraResource=../dist  --icon=assets/icons/win/icon.ico --prune=true --out=release-builds --version-string.CompanyName=CE --version-string.FileDescription=CE --version-string.ProductName="HumanTest"
fi

# make Linux
electron-packager . HumanTest --overwrite --asar --platform=linux --arch=x64 --extraResource=../index.html --extraResource=../css --extraResource=../dist   --icon=assets/icons/png/1024x1024.png --prune=true --out=release-builds
