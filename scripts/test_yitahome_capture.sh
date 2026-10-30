#!/bin/bash
export ANDROID_HOME=/home/dinatih/.cache/room-3d-android/sdk
export ANDROID_AVD_HOME=/home/dinatih/.cache/room-3d-android/avd
export ANDROID_USER_HOME=/home/dinatih/.cache/room-3d-android/user
ADB="$ANDROID_HOME/platform-tools/adb -s emulator-5556"

killall -9 adb emulator qemu-system-x86_64 2>/dev/null || true
rm -f /home/dinatih/.cache/room-3d-android/avd/room3d-amazon35.avd/*.lock /run/user/1000/avd/running/*

$ANDROID_HOME/emulator/emulator -avd room3d-amazon35 -port 5556 -no-window -no-audio -gpu swiftshader &
EMU_PID=$!
$ADB wait-for-device
while [ "$($ADB shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" != "1" ]; do sleep 2; done

$ADB shell settings put global http_proxy :0
$ADB shell "su 0 ip rule add from all lookup 1015 pref 100 2>/dev/null || true"

echo "Launching Amazon app..."
$ADB shell am start -n com.amazon.mShop.android.shopping/com.amazon.mShop.home.HomeActivity
sleep 6

echo "Opening search box..."
$ADB shell input tap 360 108
sleep 3

echo "Typing ASIN..."
$ADB shell input text "B08TQMJJN4"
sleep 1
$ADB shell input keyevent 66
sleep 6

$ADB shell screencap -p /sdcard/yita_search_clean.png
$ADB pull /sdcard/yita_search_clean.png /tmp/yita_search_clean.png
$ADB shell uiautomator dump /sdcard/yita_search_clean.xml
$ADB pull /sdcard/yita_search_clean.xml /tmp/yita_search_clean.xml

$ADB emu kill

