cd ../swarmDB/proto
protoc --js_out=import_style=commonjs,binary:../../proto database.proto
protoc --js_out=import_style=commonjs,binary:../../proto bluzelle.proto