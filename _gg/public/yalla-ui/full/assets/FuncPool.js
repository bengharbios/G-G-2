var functionPool = new Object();
functionPool.functions = {};
functionPool.functionID = Math.ceil(Math.random() * 10000);
functionPool.addFunction = function (func) {
    this.functionID++;
    var functionID = "function_" + this.functionID;
    this.functions[functionID] = func;
    return functionID;
};

functionPool.removeFunction = function (functionID) {
    delete this.functions[functionID];
};

functionPool.removeAllFunctions = function () {
    this.functions = {};
};

functionPool.callFunction = function (functionID, args) {
    var func = this.functions[functionID];
    if (args) {
        if (Object.prototype.toString.call(args) == "[object String]") {
            args = JSON.parse(args);
        };
        func(args);
    } else {
        func()
    }
};