#!/usr/bin/ruby -w

# This script replaces the string 'require("./build/Release/scrypt")' with 'require("scrypt")' in
# node_modules/scrypt/index.js, which resolves a webpack error.

f = './node_modules/scrypt/index.js'

text = File.read(f)
new_contents = text.gsub(/\.\/build\/Release\/scrypt/, "scrypt")
File.open(f, "w") {|file| file.puts new_contents }