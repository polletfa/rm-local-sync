# rm-local-sync

rm-local-sync is used to download the content of a reMarkable&reg; tablet using the USB interface.
When run, the program downloads all changed files into a cache directory and generates an index using hard file links.

# Compile and test

```
npm run compile                      # compile
npm run start <DIRECTORY>            # start and use <DIRECTORY> to store files (./data if omitted)

npm run webpack                      # Generate the deployment version
node _build/release.js <DIRECTORY>   # start the deployment version and use <DIRECTORY> to store files (./data if omitted)
```

# License

&copy; 2023 Fabien Pollet <polletfa@posteo.de>

rm-local-sync is licensed under the MIT license. See the LICENSE file for details.

# Trademarks

reMarkable&reg; is a registered trademark of reMarkable AS. rm-local-sync is not affiliated with, or endorsed by, reMarkable AS. The use of “reMarkable” in this work refers to the company’s e-paper tablet product(s).