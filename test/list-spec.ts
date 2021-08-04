import {padStart} from 'lodash'

before(function() {
//    let suites: number = 0;
    let tests: number = 0;
    let pending:number  = 0;

    let root = mapSuite(this.test?.parent);

//    process.stdout.write(JSON.stringify({suites, tests, pending, root}, null, '    '));
    console.log('Specs: ', tests);
    console.log('Pending:', pending);
//    console.log(JSON.stringify(root, null, '    '));

    print(root);

    process.exit(0);

    function print(root: any, level= 0) {
        root.tests.forEach((test:any) => console.log(padStart(undefined, level * 4), test.title));
        root.suites.forEach((suite: any) => {
            console.log(padStart(undefined, level * 4), suite.title)
            print(suite, level + 1);
        });
    }

    function mapSuite(suite: any) {
//        suites += +!suite.root;
        return {
            title: suite.root ? '(root)' : suite.title,
            suites: suite.suites.map(mapSuite),
            tests: suite.tests.map(mapTest)
        };
    }

    function mapTest(test: any) {
        ++tests;
        pending += +test.pending;
        return {
            title: test.title,
            pending: test.pending
        };
    }
});