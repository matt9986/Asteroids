Function.prototype.inherits = function(fun) {
  function Surrogate() {};
  Surrogate.prototype = fun.prototype;
  this.prototype = new Surrogate();
}

function sum() {
  args = Array.prototype.slice.call(arguments)
  sum = 0
  for (i = 0; i < args.length; i++) {
    sum += args[i];
  }
  return sum;
}

Function.prototype.myBind = function(myObj) {
  args = Array.prototype.slice.call(arguments, 1);
  return function () {
    this.apply(myObj, args);
  }
}

var curriedSum = function(numArgs) {
  var numbers = [];
  return function adder() {
    numbers = numbers.concat(Array.prototype.slice.call(arguments, 0))
    if(numbers.length >= numArgs){
      return (function(){
        var sum = 0;
        for (i = 0; i < numArgs; i++) {
            sum += numbers[i];
          }
          return sum;
      }());
    }else{
      return adder;
    }
  }
}
var add = curriedSum(3);
console.log(add(4, 5,4,3,2));