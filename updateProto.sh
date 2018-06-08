cd swarmDB/proto
protoc --js_out=import_style=commonjs,binary:../../ database.proto
protoc --js_out=import_style=commonjs,binary:../../ bluzelle.proto