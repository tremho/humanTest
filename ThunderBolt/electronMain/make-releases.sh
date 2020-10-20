wpk=`which electron-packager`
wwn=`which wine64`
wdc=`which documentation`
plt=`uname`

if [ $wpk == ""]; then
  npm install -g electron-packager
fi

# we'll need this later on, may as well do it here
if [ $wdc == ""]; then
  npm install -g documentation
fi

# Announce for debugging trail if needed
electron-packager --version

rm -fr release-builds

# make Mac
electron-packager . --overwrite --platform=darwin --arch=x64 --extraResource=../index.html --extraResource=../css --extraResource=../dist --icon=assets/icons/mac/icon.icns --prune=true --out=release-builds

# make Windows
if [ $wwn != "" ]; then
  electron-packager . HumanTest --overwrite --asar --platform=win32 --arch=ia32  --extraResource=../index.html --extraResource=../css --extraResource=../dist  --icon=assets/icons/win/icon.ico --prune=true --out=release-builds --version-string.CompanyName=CE --version-string.FileDescription=CE --version-string.ProductName="HumanTest"
else
  echo "Not creating Windows app -- wine64 is not available. Daddy Needs Wine!"
fi

# make Linux
electron-packager . HumanTest --overwrite --asar --platform=linux --arch=x64 --extraResource=../index.html --extraResource=../css --extraResource=../dist   --icon=assets/icons/png/1024x1024.png --prune=true --out=release-builds
