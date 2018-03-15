# pst-extractor

![npm](https://img.shields.io/npm/v/pst-extractor.svg) ![license](https://img.shields.io/npm/l/pst-extractor.svg) ![github-issues](https://img.shields.io/github/issues/epfromer/pst-extractor.svg)  ![Circle CI build status](https://circleci.com/gh/epfromer/pst-extractor.svg?style=svg)

Extract objects from MS Outlook/Exchange PST files

![nodei.co](https://nodei.co/npm/pst-extractor.png?downloads=true&downloadRank=true&stars=true)

![travis-status](https://img.shields.io/travis/epfromer/pst-extractor.svg)
![stars](https://img.shields.io/github/stars/epfromer/pst-extractor.svg)
![forks](https://img.shields.io/github/forks/epfromer/pst-extractor.svg)

![forks](https://img.shields.io/github/forks/epfromer/pst-extractor.svg)

![](https://david-dm.org/epfromer/pst-extractor/status.svg)
![](https://david-dm.org/epfromer/pst-extractor/dev-status.svg)

## Features

Extract objects from MS Outlook/Exchange PST files.

This is based off the code from https://github.com/rjohnsondev/java-libpst. Thanks to Richard Johnson and Orin Eman.

A spec from Microsoft on the PST file format is at https://msdn.microsoft.com/en-us/library/ff385210(v=office.12).aspx.

Start with index.ts for sample code to walk the PST and print out the folder structure to the console. Also, most of the major objects have Mocha test specs which show how the object attributes can be accessed.

## Install

`npm install --save pst-extractor`


## Scripts

 - **npm run build** : `tsc`
 - **npm run test** : `nyc --reporter=html mocha --opts mocha.opts`
 - **npm run readme** : `node ./node_modules/.bin/node-readme`

## Dependencies

Package | Version | Dev
--- |:---:|:---:
[fs-ext](https://www.npmjs.com/package/fs-ext) | ^1.0.0 | ✖
[long](https://www.npmjs.com/package/long) | ^4.0.0 | ✖
[math-float64-from-bits](https://www.npmjs.com/package/math-float64-from-bits) | ^1.0.0 | ✖
[uuid-parse](https://www.npmjs.com/package/uuid-parse) | ^1.0.0 | ✖
[winston](https://www.npmjs.com/package/winston) | ^2.4.1 | ✖
[winston-loggly](https://www.npmjs.com/package/winston-loggly) | ^1.3.1 | ✖
[winston-loggly-bulk](https://www.npmjs.com/package/winston-loggly-bulk) | ^2.0.2 | ✖
[@types/chai](https://www.npmjs.com/package/@types/chai) | ^4.1.2 | ✔
[@types/debug](https://www.npmjs.com/package/@types/debug) | 0.0.30 | ✔
[@types/fs-ext](https://www.npmjs.com/package/@types/fs-ext) | 0.0.29 | ✔
[@types/long](https://www.npmjs.com/package/@types/long) | ^3.0.32 | ✔
[@types/mocha](https://www.npmjs.com/package/@types/mocha) | ^2.2.48 | ✔
[@types/node](https://www.npmjs.com/package/@types/node) | ^9.4.7 | ✔
[@types/typescript](https://www.npmjs.com/package/@types/typescript) | ^2.0.0 | ✔
[@types/winston](https://www.npmjs.com/package/@types/winston) | ^2.3.8 | ✔
[chai](https://www.npmjs.com/package/chai) | ^4.1.2 | ✔
[chai-datetime](https://www.npmjs.com/package/chai-datetime) | ^1.5.0 | ✔
[debug](https://www.npmjs.com/package/debug) | ^3.1.0 | ✔
[mocha](https://www.npmjs.com/package/mocha) | ^5.0.4 | ✔
[node-readme](https://www.npmjs.com/package/node-readme) | ^0.1.9 | ✔
[nyc](https://www.npmjs.com/package/nyc) | ^11.6.0 | ✔
[source-map-support](https://www.npmjs.com/package/source-map-support) | ^0.5.4 | ✔
[supports-color](https://www.npmjs.com/package/supports-color) | ^5.3.0 | ✔
[ts-node](https://www.npmjs.com/package/ts-node) | ^5.0.1 | ✔
[typescript](https://www.npmjs.com/package/typescript) | ^2.7.2 | ✔


## Contributing

Contributions welcome; Please submit all pull requests the against master branch. If your pull request contains JavaScript patches or features, you should include relevant unit tests. Please check the [Contributing Guidelines](contributng.md) for more details. Thanks!

## Author



## License

 - **ISC** : http://opensource.org/licenses/ISC
