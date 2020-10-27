
file=ht-app.tgz
url=https://github.com/tremho/humanTest/releases/download/v0.3.0/ht-app.tgz

pwd=`pwd`
which wget >/dev/null
w=$?
which curl >/dev/null
c=$?

if [[ $w -eq 0 ]];then
  wget $url $file;
  x=$?
elif [[ $c -eq 0 ]]; then
  curl -Lo $file $url;
  x=$?
else
  echo ""
  echo "----------------------\033[0;31mATTENTION\033[0m ---------------------"
  echo "Neither curl nor wget was found."
  echo "Download and unpack $url manually into $pwd for proper install."
  echo ""
  echo "------------------------------------------------------"
  echo ""
  x=1
fi

if [[ $x -eq 0 ]];then
  tar xzf ht-app.tgz
  rm ht-app.tgz
fi

