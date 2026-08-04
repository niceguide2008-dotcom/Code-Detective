
"use strict";

// =============================================
// GAME STATE
// =============================================
const state = {
  currentScreen: 'dashboard',
  currentCaseIndex: 0,
  totalXP: 1250,
  casesCompleted: 3,
  streak: 3,
  accuracy: 87,

  // Per-case state
  caseState: {
    suspectSelected: null,
    reasonSelected: null,
    fixSelected: null,
    cluesRevealed: 0,
    step: 1,
  }
};

// =============================================
// CASE DATA
// =============================================
const CASES = [
  {
    id: '#007',
    title: 'The Calculator Murder',
    topic: 'Operators',
    difficulty: 'Medium',
    difficultyColor: 'amber',
    xpReward: 250,
    filename: 'Calculator.java',
    description: 'A critical division operation gone fatally wrong.',
    bannerSnippet: 'int share = <span class="text-crimson">money / people</span>;',
    code: [
      { text: '<span class="keyword">public class</span> <span class="class-name">Calculator</span> {', bug: false },
      { text: '', bug: false },
      { text: '  <span class="keyword">public static void</span> <span class="method">main</span>(<span class="type">String</span>[] args) {', bug: false },
      { text: '    <span class="type">int</span> money = <span class="number">1000</span>;', bug: false },
      { text: '    <span class="type">int</span> people = <span class="number">0</span>; <span class="comment">// ← Watch out!</span>', bug: false },
      { text: '    <span class="type">int</span> share = money <span class="operator">/</span> people;', bug: true },
      { text: '    <span class="class-name">System</span>.<span class="variable">out</span>.<span class="method">println</span>(<span class="string">"Each gets: "</span> + share);', bug: false },
      { text: '  }', bug: false },
      { text: '}', bug: false },
    ],
    clues: [
      { text: 'The victim (CPU) crashed at line 6 with a fatal runtime error, not a compile-time error.', icon: '🔬' },
      { text: 'The variable `people` holds the value 0. Mathematics forbids division by zero.', icon: '➗' },
      { text: 'The fix involves checking if `people` is zero before performing the division.', icon: '🛡️' },
    ],
    suspects: [
      { name: 'NullPointerException', icon: '💀', correct: false },
      { name: 'ArithmeticException', icon: '➗', correct: true },
      { name: 'ArrayIndexOutOfBoundsException', icon: '📊', correct: false },
      { name: 'NumberFormatException', icon: '🔢', correct: false },
    ],
    reasons: [
      { text: 'A variable was not initialized before use', correct: false },
      { text: 'Division by zero is an illegal mathematical operation', correct: true },
      { text: 'The array index exceeded its boundary', correct: false },
      { text: 'A null object was dereferenced', correct: false },
    ],
    fixes: [
      { text: 'if (people != 0) { int share = money / people; }', correct: true },
      { text: 'int share = money * people;', correct: false },
      { text: 'int people = null;', correct: false },
      { text: 'people = people + 1;', correct: false },
    ],
    detectorNote: 'Notice line 5: `people = 0`. Now trace what happens on line 6 when the JVM executes `money / people`.',
    criminal: 'ArithmeticException',
  },
  {
    id: '#012',
    title: 'The Index Heist',
    topic: 'Arrays',
    difficulty: 'Easy',
    difficultyColor: 'green',
    xpReward: 150,
    filename: 'GradeBook.java',
    description: 'An off-by-one error lurks in a loop, causing a boundary breach.',
    bannerSnippet: 'for(int i=0; i <span class="text-crimson">&lt;=</span> marks.length; i++)',
    code: [
      { text: '<span class="keyword">public class</span> <span class="class-name">GradeBook</span> {', bug: false },
      { text: '', bug: false },
      { text: '  <span class="keyword">public static void</span> <span class="method">main</span>(<span class="type">String</span>[] args) {', bug: false },
      { text: '    <span class="type">int</span>[] marks = {<span class="number">85</span>, <span class="number">92</span>, <span class="number">78</span>, <span class="number">95</span>, <span class="number">88</span>};', bug: false },
      { text: '    <span class="type">int</span> total = <span class="number">0</span>;', bug: false },
      { text: '    <span class="keyword">for</span>(<span class="type">int</span> i = <span class="number">0</span>; i <span class="operator">&lt;=</span> marks.<span class="method">length</span>; i++) {', bug: true },
      { text: '      total <span class="operator">+=</span> marks[i];', bug: true },
      { text: '    }', bug: false },
      { text: '    <span class="class-name">System</span>.<span class="variable">out</span>.<span class="method">println</span>(<span class="string">"Total: "</span> + total);', bug: false },
      { text: '  }', bug: false },
      { text: '}', bug: false },
    ],
    clues: [
      { text: 'The array `marks` has 5 elements (indices 0–4). A 5-element array has no index 5.', icon: '📊' },
      { text: '`marks.length` equals 5. The condition `i <= 5` allows `i` to reach 5, which does not exist.', icon: '🔢' },
      { text: 'The fix is a single character change: `<=` must become `<` to stay within bounds.', icon: '🔧' },
    ],
    suspects: [
      { name: 'ArithmeticException', icon: '➗', correct: false },
      { name: 'NullPointerException', icon: '💀', correct: false },
      { name: 'ArrayIndexOutOfBoundsException', icon: '📊', correct: true },
      { name: 'ClassCastException', icon: '🔄', correct: false },
    ],
    reasons: [
      { text: 'The loop condition uses `<=` instead of `<`, allowing access beyond the array boundary', correct: true },
      { text: 'The array was declared with an incorrect type', correct: false },
      { text: 'The array was never initialized with values', correct: false },
      { text: 'Division by zero was performed inside the loop', correct: false },
    ],
    fixes: [
      { text: 'for(int i = 0; i < marks.length; i++)', correct: true },
      { text: 'for(int i = 1; i <= marks.length; i++)', correct: false },
      { text: 'for(int i = 0; i == marks.length; i++)', correct: false },
      { text: 'int[] marks = new int[10];', correct: false },
    ],
    detectorNote: 'Count the array elements: {85, 92, 78, 95, 88} — that\'s 5 items. What does `marks.length` return? Now trace the loop condition.',
    criminal: 'ArrayIndexOutOfBoundsException',
  },
  {
    id: '#019',
    title: 'The Null Assassin',
    topic: 'Strings',
    difficulty: 'Hard',
    difficultyColor: 'crimson',
    xpReward: 350,
    filename: 'UserProfile.java',
    description: 'A null String silently carries a deadly payload — calling a method on nothing.',
    bannerSnippet: '<span class="text-crimson">null</span>.<span class="method">length</span>()',
    code: [
      { text: '<span class="keyword">public class</span> <span class="class-name">UserProfile</span> {', bug: false },
      { text: '', bug: false },
      { text: '  <span class="keyword">public static void</span> <span class="method">main</span>(<span class="type">String</span>[] args) {', bug: false },
      { text: '    <span class="type">String</span> name = <span class="keyword">null</span>; <span class="comment">// ← No value assigned!</span>', bug: false },
      { text: '    <span class="type">int</span> len = name.<span class="method">length</span>(); ', bug: true },
      { text: '    <span class="class-name">System</span>.<span class="variable">out</span>.<span class="method">println</span>(<span class="string">"Name length: "</span> + len);', bug: false },
      { text: '  }', bug: false },
      { text: '}', bug: false },
    ],
    clues: [
      { text: '`name` is null — it does not point to any String object in memory. It is a ghost reference.', icon: '👻' },
      { text: 'Calling `.length()` requires a real String object. You cannot call methods on null.', icon: '☠️' },
      { text: 'The fix: check `if (name != null)` before calling `.length()`, or initialize `name` with a value.', icon: '🛡️' },
    ],
    suspects: [
      { name: 'StackOverflowError', icon: '🔁', correct: false },
      { name: 'ArrayIndexOutOfBoundsException', icon: '📊', correct: false },
      { name: 'NullPointerException', icon: '💀', correct: true },
      { name: 'StringIndexOutOfBoundsException', icon: '🔤', correct: false },
    ],
    reasons: [
      { text: 'The String was assigned `null` and a method was called on it without null-check', correct: true },
      { text: 'The string index was out of range during character access', correct: false },
      { text: 'The method was called with wrong argument types', correct: false },
      { text: 'The variable was declared but never used', correct: false },
    ],
    fixes: [
      { text: 'if (name != null) { int len = name.length(); }', correct: true },
      { text: 'int len = null.length();', correct: false },
      { text: 'String name = new String();', correct: false },
      { text: 'name = name.trim();', correct: false },
    ],
    detectorNote: 'Line 4 assigns `null` — meaning `name` references nothing. Line 5 tries to call `.length()` on this ghost reference.',
    criminal: 'NullPointerException',
  }
  ,{
    id: 'OOP-01',
    title: 'The Missing Constructor',
    topic: 'OOP',
    difficulty: 'Beginner',
    difficultyColor: 'green',
    xpReward: 100,
    filename: 'Student.java',
    description: 'A parameterized constructor without a default counterpart causes an instantiation failure.',
    bannerSnippet: 'Student s = <span class="text-crimson">new Student()</span>;',
    code: [
      { text: '<span class="keyword">class</span> <span class="class-name">Student</span> {', bug: false },
      { text: '    <span class="type">String</span> name;', bug: false },
      { text: '    <span class="type">int</span> age;', bug: false },
      { text: '', bug: false },
      { text: '    <span class="class-name">Student</span>(<span class="type">String</span> name, <span class="type">int</span> age) {', bug: false },
      { text: '        <span class="keyword">this</span>.name = name;', bug: false },
      { text: '        <span class="keyword">this</span>.age = age;', bug: false },
      { text: '    }', bug: false },
      { text: '}', bug: false },
      { text: '', bug: false },
      { text: '<span class="class-name">Student</span> s = <span class="keyword">new</span> <span class="class-name">Student</span>();', bug: true }
    ],
    clues: [
      { text: 'The Student class defines exactly one constructor, and it takes two parameters.', icon: '🔍' },
      { text: 'When you define a parameterized constructor, Java does not automatically provide a default (no-arg) constructor.', icon: '💡' },
      { text: 'The object creation at the bottom provides zero arguments.', icon: '⚠️' }
    ],
    suspects: [
      { name: 'NullPointerException', icon: '💀', correct: false },
      { name: 'Constructor mismatch', icon: '🏗️', correct: true },
      { name: 'SyntaxError', icon: '❌', correct: false },
      { name: 'Private member access violation', icon: '🔒', correct: false }
    ],
    reasons: [
      { text: 'The Student class is abstract', correct: false },
      { text: 'The provided arguments do not match the required constructor parameters', correct: true },
      { text: 'The class variables are not initialized properly', correct: false },
      { text: 'You cannot instantiate a class from outside', correct: false }
    ],
    fixes: [
      { text: 'Student s = new Student("Arun", 18);', correct: true },
      { text: 'Student s = null;', correct: false },
      { text: 'Student s = new Student(18, "Arun");', correct: false },
      { text: 'Student s = new Student[];', correct: false }
    ],
    detectorNote: 'Look at the constructor definition and compare it with the instantiation call.',
    criminal: 'Constructor mismatch'
  },
  {
    id: 'OOP-02',
    title: 'The Private Vault',
    topic: 'OOP',
    difficulty: 'Beginner',
    difficultyColor: 'green',
    xpReward: 100,
    filename: 'BankAccount.java',
    description: 'An illegal access to a private field breaks encapsulation.',
    bannerSnippet: 'System.out.println(<span class="text-crimson">account.balance</span>);',
    code: [
      { text: '<span class="keyword">class</span> <span class="class-name">BankAccount</span> {', bug: false },
      { text: '    <span class="keyword">private</span> <span class="type">double</span> balance = <span class="number">5000</span>;', bug: false },
      { text: '}', bug: false },
      { text: '', bug: false },
      { text: '<span class="class-name">BankAccount</span> account = <span class="keyword">new</span> <span class="class-name">BankAccount</span>();', bug: false },
      { text: '<span class="class-name">System</span>.<span class="variable">out</span>.<span class="method">println</span>(account.balance);', bug: true }
    ],
    clues: [
      { text: 'The balance field belongs to the BankAccount class.', icon: '🔍' },
      { text: 'The balance field is declared with the private access modifier.', icon: '🔒' },
      { text: 'The code attempts to access balance directly from outside the class.', icon: '⚠️' }
    ],
    suspects: [
      { name: 'NullPointerException', icon: '💀', correct: false },
      { name: 'Private member access violation', icon: '🔒', correct: true },
      { name: 'Variable shadowing', icon: '👥', correct: false },
      { name: 'Constructor mismatch', icon: '🏗️', correct: false }
    ],
    reasons: [
      { text: 'Private members cannot be accessed directly from outside their defining class', correct: true },
      { text: 'The balance variable was never initialized', correct: false },
      { text: 'System.out.println cannot print double values', correct: false },
      { text: 'The object account is null', correct: false }
    ],
    fixes: [
      { text: 'System.out.println(account.getBalance()); // Assuming getBalance is defined', correct: true },
      { text: 'System.out.println(BankAccount.balance);', correct: false },
      { text: 'System.out.println(account->balance);', correct: false },
      { text: 'System.out.println(balance);', correct: false }
    ],
    detectorNote: 'Notice the private modifier on balance. How can we access private data safely?',
    criminal: 'Private member access violation'
  },
  {
    id: 'OOP-03',
    title: 'The Forgotten Identity',
    topic: 'OOP',
    difficulty: 'Intermediate',
    difficultyColor: 'amber',
    xpReward: 150,
    filename: 'Detective.java',
    description: 'A classic variable shadowing issue where the object field is never updated.',
    bannerSnippet: '<span class="text-crimson">name = name;</span>',
    code: [
      { text: '<span class="keyword">class</span> <span class="class-name">Detective</span> {', bug: false },
      { text: '    <span class="type">String</span> name;', bug: false },
      { text: '', bug: false },
      { text: '    <span class="class-name">Detective</span>(<span class="type">String</span> name) {', bug: false },
      { text: '        name = name;', bug: true },
      { text: '    }', bug: false },
      { text: '}', bug: false },
      { text: '', bug: false },
      { text: '<span class="class-name">Detective</span> d = <span class="keyword">new</span> <span class="class-name">Detective</span>(<span class="string">"Eddie"</span>);', bug: false },
      { text: '<span class="class-name">System</span>.<span class="variable">out</span>.<span class="method">println</span>(d.name); <span class="comment">// Prints null</span>', bug: false }
    ],
    clues: [
      { text: 'The constructor parameter is named `name`, and the instance variable is also named `name`.', icon: '👥' },
      { text: 'When a parameter and instance variable share the same name, the parameter shadows the instance variable.', icon: '🌑' },
      { text: 'In `name = name;`, the parameter is simply assigning its value to itself.', icon: '🔁' }
    ],
    suspects: [
      { name: 'Variable shadowing', icon: '👥', correct: true },
      { name: 'NullPointerException', icon: '💀', correct: false },
      { name: 'Missing inheritance', icon: '🧬', correct: false },
      { name: 'Private member access violation', icon: '🔒', correct: false }
    ],
    reasons: [
      { text: 'The instance variable name is shadowed by the constructor parameter', correct: true },
      { text: 'The object is null', correct: false },
      { text: 'The Detective class has no constructor', correct: false },
      { text: 'Strings cannot be modified after creation', correct: false }
    ],
    fixes: [
      { text: 'this.name = name;', correct: true },
      { text: 'name = this.name;', correct: false },
      { text: 'Detective.name = name;', correct: false },
      { text: 'name = "Eddie";', correct: false }
    ],
    detectorNote: 'How do you refer to the current object instance inside a constructor?',
    criminal: 'Variable shadowing'
  },
  {
    id: 'OOP-04',
    title: 'The Inheritance Impostor',
    topic: 'OOP',
    difficulty: 'Intermediate',
    difficultyColor: 'amber',
    xpReward: 150,
    filename: 'Dog.java',
    description: 'An attempt to use a parent method fails because the inheritance relationship is missing.',
    bannerSnippet: 'Dog d = new Dog(); <span class="text-crimson">d.eat();</span>',
    code: [
      { text: '<span class="keyword">class</span> <span class="class-name">Animal</span> {', bug: false },
      { text: '    <span class="keyword">void</span> <span class="method">eat</span>() {', bug: false },
      { text: '        <span class="class-name">System</span>.<span class="variable">out</span>.<span class="method">println</span>(<span class="string">"Eating"</span>);', bug: false },
      { text: '    }', bug: false },
      { text: '}', bug: false },
      { text: '', bug: false },
      { text: '<span class="keyword">class</span> <span class="class-name">Dog</span> {', bug: true },
      { text: '    <span class="keyword">void</span> <span class="method">bark</span>() {', bug: false },
      { text: '        <span class="class-name">System</span>.<span class="variable">out</span>.<span class="method">println</span>(<span class="string">"Barking"</span>);', bug: false },
      { text: '    }', bug: false },
      { text: '}', bug: false },
      { text: '', bug: false },
      { text: '<span class="class-name">Dog</span> d = <span class="keyword">new</span> <span class="class-name">Dog</span>();', bug: false },
      { text: 'd.<span class="method">eat</span>();', bug: true }
    ],
    clues: [
      { text: 'The `eat()` method is defined inside the Animal class.', icon: '🦴' },
      { text: 'The `Dog` class is completely separate from `Animal`.', icon: '🚫' },
      { text: 'A class must use `extends` to inherit methods from another class.', icon: '🧬' }
    ],
    suspects: [
      { name: 'Variable shadowing', icon: '👥', correct: false },
      { name: 'Missing inheritance relationship', icon: '🧬', correct: true },
      { name: 'Incorrect method override', icon: '🔀', correct: false },
      { name: 'Abstract class instantiation', icon: '👻', correct: false }
    ],
    reasons: [
      { text: 'The Dog class lacks the extends keyword to inherit from Animal', correct: true },
      { text: 'The eat() method is private in Animal', correct: false },
      { text: 'Dog cannot have its own methods like bark()', correct: false },
      { text: 'Animal is not an interface', correct: false }
    ],
    fixes: [
      { text: 'class Dog extends Animal {', correct: true },
      { text: 'class Dog implements Animal {', correct: false },
      { text: 'class Dog uses Animal {', correct: false },
      { text: 'class Dog inherits Animal {', correct: false }
    ],
    detectorNote: 'Look at the class declaration of Dog. Is it linked to Animal in any way?',
    criminal: 'Missing inheritance relationship'
  },
  {
    id: 'OOP-05',
    title: 'The Silent Override',
    topic: 'OOP',
    difficulty: 'Intermediate',
    difficultyColor: 'amber',
    xpReward: 150,
    filename: 'Animal.java',
    description: 'A method override fails silently due to a typo in the method signature.',
    bannerSnippet: 'void <span class="text-crimson">Sound()</span> { System.out.println("Bark"); }',
    code: [
      { text: '<span class="keyword">class</span> <span class="class-name">Animal</span> {', bug: false },
      { text: '    <span class="keyword">void</span> <span class="method">sound</span>() {', bug: false },
      { text: '        <span class="class-name">System</span>.<span class="variable">out</span>.<span class="method">println</span>(<span class="string">"Animal"</span>);', bug: false },
      { text: '    }', bug: false },
      { text: '}', bug: false },
      { text: '', bug: false },
      { text: '<span class="keyword">class</span> <span class="class-name">Dog</span> <span class="keyword">extends</span> <span class="class-name">Animal</span> {', bug: false },
      { text: '    <span class="keyword">void</span> <span class="method">Sound</span>() { <span class="comment">// Capital S!</span>', bug: true },
      { text: '        <span class="class-name">System</span>.<span class="variable">out</span>.<span class="method">println</span>(<span class="string">"Bark"</span>);', bug: false },
      { text: '    }', bug: false },
      { text: '}', bug: false },
      { text: '', bug: false },
      { text: '<span class="class-name">Animal</span> a = <span class="keyword">new</span> <span class="class-name">Dog</span>();', bug: false },
      { text: 'a.<span class="method">sound</span>(); <span class="comment">// Prints "Animal"</span>', bug: false }
    ],
    clues: [
      { text: 'The parent method is `sound()`.', icon: '🔊' },
      { text: 'The child method is `Sound()`.', icon: '🔠' },
      { text: 'Java is case-sensitive, so these are treated as completely different methods.', icon: '⚖️' }
    ],
    suspects: [
      { name: 'Missing inheritance relationship', icon: '🧬', correct: false },
      { name: 'Incorrect method override', icon: '🔀', correct: true },
      { name: 'Variable shadowing', icon: '👥', correct: false },
      { name: 'Runtime polymorphism error', icon: '🎭', correct: false }
    ],
    reasons: [
      { text: 'The method names do not match exactly, so it is overloading, not overriding', correct: true },
      { text: 'The Dog class needs to be abstract', correct: false },
      { text: 'You cannot call methods using parent references', correct: false },
      { text: 'The sound method is not declared as virtual', correct: false }
    ],
    fixes: [
      { text: '@Override void sound() {', correct: true },
      { text: 'void override sound() {', correct: false },
      { text: 'void sound(String s) {', correct: false },
      { text: 'public void Sound() {', correct: false }
    ],
    detectorNote: 'What annotation can we use to ensure a method is genuinely overriding a parent method?',
    criminal: 'Incorrect method override'
  },
  {
    id: 'OOP-06',
    title: 'The Identity Switch',
    topic: 'OOP',
    difficulty: 'Hard',
    difficultyColor: 'crimson',
    xpReward: 250,
    filename: 'Polymorphism.java',
    description: 'Understanding runtime polymorphism and method dispatch.',
    bannerSnippet: 'Animal suspect = <span class="text-cyan">new Dog()</span>; suspect.sound();',
    code: [
      { text: '<span class="keyword">class</span> <span class="class-name">Animal</span> {', bug: false },
      { text: '    <span class="keyword">void</span> <span class="method">sound</span>() {', bug: false },
      { text: '        <span class="class-name">System</span>.<span class="variable">out</span>.<span class="method">println</span>(<span class="string">"Animal"</span>);', bug: false },
      { text: '    }', bug: false },
      { text: '}', bug: false },
      { text: '', bug: false },
      { text: '<span class="keyword">class</span> <span class="class-name">Dog</span> <span class="keyword">extends</span> <span class="class-name">Animal</span> {', bug: false },
      { text: '    <span class="keyword">@Override</span>', bug: false },
      { text: '    <span class="keyword">void</span> <span class="method">sound</span>() {', bug: false },
      { text: '        <span class="class-name">System</span>.<span class="variable">out</span>.<span class="method">println</span>(<span class="string">"Dog"</span>);', bug: false },
      { text: '    }', bug: false },
      { text: '}', bug: false },
      { text: '', bug: false },
      { text: '<span class="class-name">Animal</span> suspect = <span class="keyword">new</span> <span class="class-name">Dog</span>();', bug: true },
      { text: 'suspect.<span class="method">sound</span>();', bug: true }
    ],
    clues: [
      { text: 'The reference type is Animal, but the actual object type in memory is Dog.', icon: '🏷️' },
      { text: 'Java uses dynamic method dispatch for overridden instance methods.', icon: '⚡' },
      { text: 'The method execution is determined by the actual object type at runtime.', icon: '🏃' }
    ],
    suspects: [
      { name: 'Compilation Error', icon: '❌', correct: false },
      { name: 'Animal', icon: '🐾', correct: false },
      { name: 'Dog', icon: '🐕', correct: true },
      { name: 'Nothing', icon: '🕳️', correct: false }
    ],
    reasons: [
      { text: 'The compiler looks at the reference type, but runtime executes the actual object type\'s method', correct: true },
      { text: 'The Animal class method takes precedence', correct: false },
      { text: 'The Dog class cannot be assigned to an Animal reference', correct: false },
      { text: 'The program crashes because types don\'t match', correct: false }
    ],
    fixes: [
      { text: 'Output is: "Dog" (Runtime Polymorphism)', correct: true },
      { text: 'Output is: "Animal"', correct: false },
      { text: 'Throws ClassCastException', correct: false },
      { text: 'Compile time error', correct: false }
    ],
    detectorNote: 'Reference Type vs Actual Object Type. Which one decides which method body executes?',
    criminal: 'Runtime Polymorphism'
  },
  {
    id: 'OOP-07',
    title: 'The Abstract Fugitive',
    topic: 'OOP',
    difficulty: 'Hard',
    difficultyColor: 'crimson',
    xpReward: 250,
    filename: 'Shape.java',
    description: 'An attempt to instantiate an abstract class.',
    bannerSnippet: 'Shape s = <span class="text-crimson">new Shape()</span>;',
    code: [
      { text: '<span class="keyword">abstract class</span> <span class="class-name">Shape</span> {', bug: false },
      { text: '    <span class="keyword">abstract void</span> <span class="method">draw</span>();', bug: false },
      { text: '}', bug: false },
      { text: '', bug: false },
      { text: '<span class="class-name">Shape</span> s = <span class="keyword">new</span> <span class="class-name">Shape</span>();', bug: true }
    ],
    clues: [
      { text: 'The Shape class is marked with the abstract keyword.', icon: '👻' },
      { text: 'Abstract classes are incomplete templates.', icon: '📝' },
      { text: 'You cannot instantiate an abstract class directly.', icon: '🚫' }
    ],
    suspects: [
      { name: 'Abstract class instantiation', icon: '👻', correct: true },
      { name: 'Missing interface method', icon: '📄', correct: false },
      { name: 'Constructor mismatch', icon: '🏗️', correct: false },
      { name: 'NullPointerException', icon: '💀', correct: false }
    ],
    reasons: [
      { text: 'Abstract classes cannot be instantiated because they may contain abstract methods', correct: true },
      { text: 'The shape class is missing a main method', correct: false },
      { text: 'The new keyword is spelled incorrectly', correct: false },
      { text: 'Abstract classes cannot have reference variables', correct: false }
    ],
    fixes: [
      { text: 'Shape s = new Circle(); // Assuming Circle extends Shape', correct: true },
      { text: 'Shape s = new abstract Shape();', correct: false },
      { text: 'abstract Shape s = new Shape();', correct: false },
      { text: 'Shape s = null;', correct: false }
    ],
    detectorNote: 'Abstract classes are like blueprints without walls; you can\'t live in them until a concrete subclass builds them.',
    criminal: 'Abstract class instantiation'
  },
  {
    id: 'OOP-08',
    title: 'The Broken Contract',
    topic: 'OOP',
    difficulty: 'Hard',
    difficultyColor: 'crimson',
    xpReward: 250,
    filename: 'Payment.java',
    description: 'A class fails to fulfill the contract of its interface.',
    bannerSnippet: 'class CreditCard <span class="text-crimson">implements Payment</span>',
    code: [
      { text: '<span class="keyword">interface</span> <span class="class-name">Payment</span> {', bug: false },
      { text: '    <span class="keyword">void</span> <span class="method">pay</span>();', bug: false },
      { text: '}', bug: false },
      { text: '', bug: false },
      { text: '<span class="keyword">class</span> <span class="class-name">CreditCard</span> <span class="keyword">implements</span> <span class="class-name">Payment</span> {', bug: true },
      { text: '    <span class="keyword">void</span> <span class="method">display</span>() {', bug: false },
      { text: '        <span class="class-name">System</span>.<span class="variable">out</span>.<span class="method">println</span>(<span class="string">"Credit Card"</span>);', bug: false },
      { text: '    }', bug: false },
      { text: '}', bug: false }
    ],
    clues: [
      { text: 'Payment is an interface that specifies a pay() method.', icon: '📜' },
      { text: 'CreditCard implements Payment but does not provide a body for pay().', icon: '❌' },
      { text: 'Implementing an interface is a contract to provide all its methods.', icon: '🤝' }
    ],
    suspects: [
      { name: 'Missing interface method implementation', icon: '📄', correct: true },
      { name: 'Abstract class instantiation', icon: '👻', correct: false },
      { name: 'Missing inheritance', icon: '🧬', correct: false },
      { name: 'Variable shadowing', icon: '👥', correct: false }
    ],
    reasons: [
      { text: 'A concrete class must implement all methods of its interfaces', correct: true },
      { text: 'Interfaces cannot have methods', correct: false },
      { text: 'CreditCard should use extends instead of implements', correct: false },
      { text: 'The pay() method should be private', correct: false }
    ],
    fixes: [
      { text: '@Override public void pay() { System.out.println("Payment completed"); }', correct: true },
      { text: 'void pay() {}', correct: false },
      { text: 'abstract class CreditCard implements Payment', correct: false },
      { text: 'public void display(Payment p) {}', correct: false }
    ],
    detectorNote: 'What method does the Payment interface require? Does CreditCard have it?',
    criminal: 'Missing interface method implementation'
  },
  {
    id: 'OOP-09',
    title: 'The Parent Constructor Mystery',
    topic: 'OOP',
    difficulty: 'Hard',
    difficultyColor: 'crimson',
    xpReward: 300,
    filename: 'Student.java',
    description: 'Subclass fails to invoke the parent constructor properly.',
    bannerSnippet: 'Student(int rollNo) { <span class="text-crimson">this.rollNo = rollNo;</span> }',
    code: [
      { text: '<span class="keyword">class</span> <span class="class-name">Person</span> {', bug: false },
      { text: '    <span class="type">String</span> name;', bug: false },
      { text: '', bug: false },
      { text: '    <span class="class-name">Person</span>(<span class="type">String</span> name) {', bug: false },
      { text: '        <span class="keyword">this</span>.name = name;', bug: false },
      { text: '    }', bug: false },
      { text: '}', bug: false },
      { text: '', bug: false },
      { text: '<span class="keyword">class</span> <span class="class-name">Student</span> <span class="keyword">extends</span> <span class="class-name">Person</span> {', bug: false },
      { text: '    <span class="type">int</span> rollNo;', bug: false },
      { text: '', bug: false },
      { text: '    <span class="class-name">Student</span>(<span class="type">int</span> rollNo) {', bug: true },
      { text: '        <span class="keyword">this</span>.rollNo = rollNo;', bug: true },
      { text: '    }', bug: true },
      { text: '}', bug: false }
    ],
    clues: [
      { text: 'Person has no default constructor, only a parameterized one.', icon: '👤' },
      { text: 'Java automatically inserts a call to super() (default parent constructor) in the child constructor.', icon: '🏗️' },
      { text: 'The default parent constructor does not exist, causing an error.', icon: '❌' }
    ],
    suspects: [
      { name: 'Constructor mismatch', icon: '🏗️', correct: false },
      { name: 'Parent constructor mismatch', icon: '🧬', correct: true },
      { name: 'Variable shadowing', icon: '👥', correct: false },
      { name: 'Incorrect method override', icon: '🔀', correct: false }
    ],
    reasons: [
      { text: 'The subclass constructor must explicitly call the matching parent constructor using super(...)', correct: true },
      { text: 'The Student class must be abstract', correct: false },
      { text: 'The rollNo variable is not accessible in Person', correct: false },
      { text: 'The name variable is private', correct: false }
    ],
    fixes: [
      { text: 'Student(String name, int rollNo) { super(name); this.rollNo = rollNo; }', correct: true },
      { text: 'Student(int rollNo) { super(); this.rollNo = rollNo; }', correct: false },
      { text: 'Student(int rollNo) { Person.name = "Unknown"; this.rollNo = rollNo; }', correct: false },
      { text: 'Student(int rollNo) { this.name = "Unknown"; }', correct: false }
    ],
    detectorNote: 'If the parent has a specific constructor, the child MUST call it. How do we invoke a parent constructor?',
    criminal: 'Parent constructor mismatch'
  },
  {
    id: 'OOP-10',
    title: 'The Static Doppelgänger',
    topic: 'OOP',
    difficulty: 'Hard',
    difficultyColor: 'crimson',
    xpReward: 350,
    filename: 'Detective.java',
    description: 'Understanding static variables and their shared state.',
    bannerSnippet: '<span class="text-cyan">static int totalDetectives = 0;</span>',
    code: [
      { text: '<span class="keyword">class</span> <span class="class-name">Detective</span> {', bug: false },
      { text: '    <span class="type">String</span> name;', bug: false },
      { text: '    <span class="keyword">static int</span> totalDetectives = <span class="number">0</span>;', bug: false },
      { text: '', bug: false },
      { text: '    <span class="class-name">Detective</span>(<span class="type">String</span> name) {', bug: false },
      { text: '        <span class="keyword">this</span>.name = name;', bug: false },
      { text: '        totalDetectives++;', bug: false },
      { text: '    }', bug: false },
      { text: '}', bug: false },
      { text: '', bug: false },
      { text: '<span class="class-name">Detective</span> d1 = <span class="keyword">new</span> <span class="class-name">Detective</span>(<span class="string">"Alex"</span>);', bug: false },
      { text: '<span class="class-name">Detective</span> d2 = <span class="keyword">new</span> <span class="class-name">Detective</span>(<span class="string">"Maya"</span>);', bug: false },
      { text: '<span class="class-name">Detective</span> d3 = <span class="keyword">new</span> <span class="class-name">Detective</span>(<span class="string">"Sam"</span>);', bug: false },
      { text: '<span class="class-name">System</span>.<span class="variable">out</span>.<span class="method">println</span>(<span class="class-name">Detective</span>.totalDetectives);', bug: true }
    ],
    clues: [
      { text: 'The totalDetectives field is marked as static.', icon: '🌟' },
      { text: 'Static fields belong to the class, not individual objects.', icon: '🏢' },
      { text: 'Every time a new Detective is created, the same shared variable is incremented.', icon: '📈' }
    ],
    suspects: [
      { name: 'Compilation Error', icon: '❌', correct: false },
      { name: 'NullPointerException', icon: '💀', correct: false },
      { name: 'Shared Static State', icon: '🌟', correct: true },
      { name: 'Variable shadowing', icon: '👥', correct: false }
    ],
    reasons: [
      { text: 'A static field has only one copy shared among all instances of the class', correct: true },
      { text: 'Static variables reset for every object', correct: false },
      { text: 'You cannot access static variables through the class name', correct: false },
      { text: 'The variable shadows a local variable', correct: false }
    ],
    fixes: [
      { text: 'Output is: 3', correct: true },
      { text: 'Output is: 1', correct: false },
      { text: 'Output is: 0', correct: false },
      { text: 'Compile error', correct: false }
    ],
    detectorNote: 'How many copies of totalDetectives exist in memory? If it is shared, what is the final count?',
    criminal: 'Shared Static State'
  }
];

// =============================================
// CRIMINAL DATABASE DATA
// =============================================
const CRIMINALS = [
  {
    alias: 'The Zero Division Phantom',
    exceptionClass: 'java.lang.ArithmeticException',
    icon: '➗',
    gradient: 'linear-gradient(135deg, rgba(255, 183, 0, 0.12), transparent)',
    borderColor: 'rgba(255, 183, 0, 0.15)',
    attack: 'int result = money / people; // people = 0',
    cause: 'Occurs when an integer is divided by zero. The JVM cannot compute infinity and throws this exception immediately.',
    solvedCount: 1,
    unlocked: true,
  },
  {
    alias: 'The Index Rogue',
    exceptionClass: 'java.lang.ArrayIndexOutOfBoundsException',
    icon: '📊',
    gradient: 'linear-gradient(135deg, rgba(0, 243, 255, 0.12), transparent)',
    borderColor: 'rgba(0, 243, 255, 0.15)',
    attack: 'marks[marks.length] // Off-by-one strike',
    cause: 'Occurs when accessing an array element at an index that doesn\'t exist. Arrays are 0-indexed, so the valid range is 0 to length-1.',
    solvedCount: 1,
    unlocked: true,
  },
  {
    alias: 'The Null Assassin',
    exceptionClass: 'java.lang.NullPointerException',
    icon: '💀',
    gradient: 'linear-gradient(135deg, rgba(255, 46, 99, 0.12), transparent)',
    borderColor: 'rgba(255, 46, 99, 0.15)',
    attack: 'String name = null; name.length();',
    cause: 'The most notorious Java criminal. Occurs when you try to use a reference that points to null — calling a method, accessing a field, or indexing an array on a null object.',
    solvedCount: 1,
    unlocked: true,
  },
  {
    alias: 'The Type Impostor',
    exceptionClass: 'java.lang.ClassCastException',
    icon: '🎭',
    gradient: 'linear-gradient(135deg, rgba(155, 93, 229, 0.12), transparent)',
    borderColor: 'rgba(155, 93, 229, 0.15)',
    attack: 'Object obj = "hello"; Integer i = (Integer) obj;',
    cause: 'Occurs when you try to cast an object to a type it is not compatible with.',
    solvedCount: 0,
    unlocked: false,
  },
  {
    alias: 'The Stack Bomber',
    exceptionClass: 'java.lang.StackOverflowError',
    icon: '🔁',
    gradient: 'linear-gradient(135deg, rgba(0, 255, 136, 0.12), transparent)',
    borderColor: 'rgba(0, 255, 136, 0.15)',
    attack: 'void infinite() { infinite(); } // Infinite recursion',
    cause: 'Occurs when recursive calls spiral out of control, exhausting the call stack with no base case to stop them.',
    solvedCount: 0,
    unlocked: false,
  },
  {
    alias: 'The Format Saboteur',
    exceptionClass: 'java.lang.NumberFormatException',
    icon: '🔢',
    gradient: 'linear-gradient(135deg, rgba(255, 183, 0, 0.12), transparent)',
    borderColor: 'rgba(255, 183, 0, 0.12)',
    attack: 'int x = Integer.parseInt("abc");',
    cause: 'Occurs when attempting to parse a non-numeric string as a number.',
    solvedCount: 0,
    unlocked: false,
  }
  ,{
    alias: 'The Constructor Illusionist',
    exceptionClass: 'Constructor Mismatch',
    icon: '🏗️',
    gradient: 'linear-gradient(135deg, rgba(0, 255, 136, 0.12), transparent)',
    borderColor: 'rgba(0, 255, 136, 0.15)',
    attack: 'new Student(); // No default constructor exists',
    cause: 'Occurs when you try to instantiate an object using a constructor signature that does not exist in the class definition.',
    solvedCount: 0,
    unlocked: true,
  },
  {
    alias: 'The Private Trespasser',
    exceptionClass: 'Encapsulation Violation',
    icon: '🔒',
    gradient: 'linear-gradient(135deg, rgba(255, 46, 99, 0.12), transparent)',
    borderColor: 'rgba(255, 46, 99, 0.15)',
    attack: 'System.out.println(account.balance);',
    cause: 'Occurs when external code attempts to directly access a field marked with the private access modifier.',
    solvedCount: 0,
    unlocked: true,
  },
  {
    alias: 'The Shadow Clone',
    exceptionClass: 'Variable Shadowing',
    icon: '👥',
    gradient: 'linear-gradient(135deg, rgba(155, 93, 229, 0.12), transparent)',
    borderColor: 'rgba(155, 93, 229, 0.15)',
    attack: 'name = name; // Shadows instance variable',
    cause: 'Occurs when a local variable or parameter has the same name as an instance variable, hiding the instance variable from direct access.',
    solvedCount: 0,
    unlocked: true,
  },
  {
    alias: 'The False Heir',
    exceptionClass: 'Missing Inheritance',
    icon: '🧬',
    gradient: 'linear-gradient(135deg, rgba(255, 183, 0, 0.12), transparent)',
    borderColor: 'rgba(255, 183, 0, 0.15)',
    attack: 'class Dog { ... } // Forgot extends Animal',
    cause: 'Occurs when a class expects to inherit behavior from a parent but lacks the extends keyword to establish the relationship.',
    solvedCount: 0,
    unlocked: true,
  },
  {
    alias: 'The Typo Trickster',
    exceptionClass: 'Failed Override',
    icon: '🔀',
    gradient: 'linear-gradient(135deg, rgba(0, 243, 255, 0.12), transparent)',
    borderColor: 'rgba(0, 243, 255, 0.15)',
    attack: 'void Sound() { } // Parent method is sound()',
    cause: 'Occurs when a subclass attempts to override a parent method but makes a typo in the name or signature, resulting in a completely new method.',
    solvedCount: 0,
    unlocked: true,
  },
  {
    alias: 'The Shapeshifter',
    exceptionClass: 'Runtime Polymorphism',
    icon: '🎭',
    gradient: 'linear-gradient(135deg, rgba(255, 46, 99, 0.12), transparent)',
    borderColor: 'rgba(255, 46, 99, 0.15)',
    attack: 'Animal suspect = new Dog(); suspect.sound();',
    cause: 'Not a bug, but a powerful feature: Java determines which overridden method to execute based on the actual object type at runtime, not the reference type.',
    solvedCount: 0,
    unlocked: true,
  },
  {
    alias: 'The Ghost Architect',
    exceptionClass: 'Abstract Instantiation',
    icon: '👻',
    gradient: 'linear-gradient(135deg, rgba(155, 93, 229, 0.12), transparent)',
    borderColor: 'rgba(155, 93, 229, 0.15)',
    attack: 'Shape s = new Shape(); // Shape is abstract',
    cause: 'Occurs when code tries to use the new keyword directly on an abstract class, which is forbidden because it is an incomplete template.',
    solvedCount: 0,
    unlocked: true,
  },
  {
    alias: 'The Contract Breaker',
    exceptionClass: 'Unimplemented Interface',
    icon: '🤝',
    gradient: 'linear-gradient(135deg, rgba(255, 183, 0, 0.12), transparent)',
    borderColor: 'rgba(255, 183, 0, 0.15)',
    attack: 'class CreditCard implements Payment',
    cause: 'Occurs when a concrete class claims to implement an interface but fails to provide the required method bodies defined by that interface.',
    solvedCount: 0,
    unlocked: true,
  },
  {
    alias: 'The Orphan Maker',
    exceptionClass: 'Missing Super Call',
    icon: '👨‍👦',
    gradient: 'linear-gradient(135deg, rgba(0, 255, 136, 0.12), transparent)',
    borderColor: 'rgba(0, 255, 136, 0.15)',
    attack: 'Student(int rollNo) { this.rollNo = rollNo; }',
    cause: 'Occurs when a subclass constructor fails to invoke a required parameterized parent constructor via super(), causing compilation to fail.',
    solvedCount: 0,
    unlocked: true,
  },
  {
    alias: 'The Shared Hivemind',
    exceptionClass: 'Static State Mutator',
    icon: '🌟',
    gradient: 'linear-gradient(135deg, rgba(0, 243, 255, 0.12), transparent)',
    borderColor: 'rgba(0, 243, 255, 0.15)',
    attack: 'static int totalDetectives = 0; totalDetectives++;',
    cause: 'Occurs when multiple objects modify a shared static field, causing its value to change for all instances across the entire application.',
    solvedCount: 0,
    unlocked: true,
  }

];

// =============================================
// MASTERY DATA
// =============================================
const MASTERY_TOPICS = [
  { icon: '📦', name: 'Variables & Data Types', pct: 72, solved: 8, total: 11, accuracy: 88, color: 'var(--cyan)', recommended: false },
  { icon: '🔀', name: 'Conditions & Branching', pct: 58, solved: 7, total: 12, accuracy: 79, color: 'var(--amber)', recommended: true },
  { icon: '🔄', name: 'Loops & Iteration', pct: 91, solved: 10, total: 11, accuracy: 95, color: 'var(--purple)', recommended: false },
  { icon: '📊', name: 'Arrays', pct: 45, solved: 5, total: 11, accuracy: 70, color: 'var(--green)', recommended: true },
  { icon: '🔤', name: 'Strings & Characters', pct: 33, solved: 4, total: 12, accuracy: 65, color: 'var(--cyan)', recommended: true },
  { icon: '⚙️', name: 'Methods & Functions', pct: 20, solved: 2, total: 10, accuracy: 80, color: 'var(--amber)', recommended: false },
  { icon: '🏗️', name: 'OOP & Classes', pct: 0, solved: 0, total: 10, accuracy: 0, color: 'var(--cyan)' },
  { icon: '⚠️', name: 'Exceptions & Errors', pct: 0, solved: 0, total: 12, accuracy: 0, color: 'var(--text-muted)', locked: true },
];

const RANKS = [
  { name: 'Rookie Debugger', threshold: 0, icon: '🔍' },
  { name: 'Code Investigator', threshold: 500, icon: '🕵️' },
  { name: 'Senior Code Inspector', threshold: 1000, icon: '⭐' },
  { name: 'Master Detective', threshold: 2000, icon: '🏆' },
  { name: 'Chief of Code Police', threshold: 4000, icon: '👑' },
];

// =============================================
// UTILITY FUNCTIONS
// =============================================
function getRank(xp) {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (xp >= r.threshold) rank = r;
    else break;
  }
  return rank;
}

function formatXP(n) {
  return n.toLocaleString();
}

function showToast(type, icon, message) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

function animateNumber(el, from, to, duration = 800) {
  const start = performance.now();
  const update = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = formatXP(Math.round(from + (to - from) * eased));
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

// =============================================
// NAVIGATION
// =============================================
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));

  const screen = document.getElementById(`screen-${screenId}`);
  const tab = document.getElementById(`tab-${screenId}`);

  if (screen) screen.classList.add('active');
  if (tab) tab.classList.add('active');
  state.currentScreen = screenId;

  if (screenId === 'crime-scene') renderCrimeScene();
  if (screenId === 'criminal-db') renderCriminalDatabase();
  if (screenId === 'mastery') renderMasteryBoard();
  if (screenId === 'dashboard') updateDashboard();
}

document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    showScreen(tab.dataset.screen);
  });
});

function goToCrimeScene() {
  showScreen('crime-scene');
}

// =============================================
// DASHBOARD
// =============================================
function updateDashboard() {
  const rank = getRank(state.totalXP);
  document.getElementById('stat-cases').textContent = state.casesCompleted;
  document.getElementById('stat-streak').textContent = state.streak;
  document.getElementById('stat-accuracy').textContent = state.accuracy + '%';
  document.getElementById('profile-rank').textContent = rank.name;
  document.getElementById('dash-streak').textContent = state.streak + ' Day Streak';

  const nextRankIdx = RANKS.findIndex(r => r.name === rank.name) + 1;
  const nextRank = RANKS[nextRankIdx];
  const xpDisplay = `${formatXP(state.totalXP)} / ${formatXP(nextRank ? nextRank.threshold : 9999)}`;
  document.getElementById('xp-display').textContent = xpDisplay;

  const pct = nextRank
    ? ((state.totalXP - rank.threshold) / (nextRank.threshold - rank.threshold)) * 100
    : 100;
  document.getElementById('xp-bar').style.width = pct + '%';

  if (nextRank) {
    document.getElementById('xp-to-next').innerHTML = `${formatXP(nextRank.threshold - state.totalXP)} DXP to <strong style="color:var(--amber)">${nextRank.name}</strong>`;
  }

  document.getElementById('nav-xp').textContent = formatXP(state.totalXP) + ' DXP';
}

// =============================================
// CRIME SCENE RENDERER
// =============================================
function renderCrimeScene() {
  const c = CASES[state.currentCaseIndex];
  resetCaseState();

  // Header
  document.getElementById('crime-case-id').textContent = `CASE ${c.id} — ${c.topic.toUpperCase()} DIVISION`;
  document.getElementById('crime-case-title').textContent = c.title;
  document.getElementById('terminal-filename').textContent = c.filename;

  // Tags
  const tagsEl = document.getElementById('crime-case-tags');
  tagsEl.innerHTML = `
    <div class="badge badge-${c.difficultyColor}">⚡ ${c.difficulty}</div>
    <div class="badge badge-crimson">🏷️ ${c.topic}</div>
    <div class="badge badge-cyan">+${c.xpReward} DXP</div>
  `;

  // Case file
  document.getElementById('case-file-id').textContent = c.id;
  document.getElementById('case-file-topic').textContent = c.topic;
  document.getElementById('case-file-reward').textContent = `+${c.xpReward} DXP`;
  document.getElementById('case-file-diff').innerHTML = `<span class="badge badge-${c.difficultyColor}">${c.difficulty}</span>`;
  document.getElementById('detective-notes').textContent = c.detectorNote;

  // Code block
  const codeBlock = document.getElementById('code-block');
  codeBlock.innerHTML = '';
  c.code.forEach((line, i) => {
    const div = document.createElement('div');
    div.className = 'code-line' + (line.bug ? ' bug-line' : '');
    div.innerHTML = `<span class="line-number">${i + 1}</span><span class="line-content">${line.text || '&nbsp;'}</span>`;
    codeBlock.appendChild(div);
  });

  // Evidence
  renderEvidence(c);

  // Suspects
  renderSuspects(c);

  // Update nav buttons
  document.getElementById('prev-case-btn').disabled = state.currentCaseIndex === 0;
  document.getElementById('next-case-nav-btn').disabled = state.currentCaseIndex === CASES.length - 1;

  // Steps
  updateSteps();
}

function resetCaseState() {
  state.caseState = {
    suspectSelected: null,
    reasonSelected: null,
    fixSelected: null,
    cluesRevealed: 0,
    step: 1,
  };
  document.getElementById('root-cause-section').style.display = 'none';
  document.getElementById('code-fix-section').style.display = 'none';
  document.getElementById('submit-section').style.display = 'none';
  document.getElementById('clues-unlocked').textContent = '0/3 Clues Revealed';
}

function renderEvidence(c) {
  const body = document.getElementById('evidence-body');
  body.innerHTML = '';
  c.clues.forEach((clue, i) => {
    const div = document.createElement('div');
    const isRevealed = i < state.caseState.cluesRevealed;
    div.className = `clue-item ${isRevealed ? 'revealed' : (i === 0 ? '' : 'locked')}`;
    div.id = `clue-${i}`;
    div.innerHTML = `
      <div class="clue-icon ${isRevealed ? 'clue-icon-unlocked' : 'clue-icon-locked'}">${isRevealed ? clue.icon : '🔒'}</div>
      <div class="clue-content">
        <div class="clue-num">Clue #${i + 1}</div>
        ${isRevealed
          ? `<div class="clue-text">${clue.text}</div>`
          : (i === 0
            ? `<div class="clue-text">Click to reveal first clue...</div><div class="clue-reveal-hint">→ Tap to examine evidence</div>`
            : `<div class="clue-text">🔒 Solve step ${i} to unlock this clue</div>`
          )
        }
      </div>
    `;
    if (!isRevealed && i === 0) {
      div.addEventListener('click', () => revealClue(i));
    } else if (!isRevealed && i > 0 && state.caseState.cluesRevealed >= i) {
      div.classList.remove('locked');
      div.addEventListener('click', () => revealClue(i));
    } else if (isRevealed) {
      div.style.cursor = 'default';
    }
    body.appendChild(div);
  });
  updateClueCounter();
}

function revealClue(index) {
  const c = CASES[state.currentCaseIndex];
  if (index !== state.caseState.cluesRevealed) return;

  state.caseState.cluesRevealed++;
  renderEvidence(c);
  updateClueCounter();
  showToast('info', c.clues[index].icon, `Clue #${index + 1} revealed!`);
}

function updateClueCounter() {
  document.getElementById('clues-unlocked').textContent = `${state.caseState.cluesRevealed}/3 Clues Revealed`;
}

function renderSuspects(c) {
  const grid = document.getElementById('suspects-grid');
  grid.innerHTML = '';
  c.suspects.forEach((s, i) => {
    const div = document.createElement('div');
    div.className = 'suspect-card';
    div.id = `suspect-${i}`;
    div.innerHTML = `<div class="suspect-icon">${s.icon}</div><div class="suspect-name">${s.name}</div>`;
    div.addEventListener('click', () => selectSuspect(i, s, c));
    grid.appendChild(div);
  });
}

function selectSuspect(i, suspect, c) {
  if (state.caseState.suspectSelected !== null) return;

  state.caseState.suspectSelected = i;
  const card = document.getElementById(`suspect-${i}`);

  if (suspect.correct) {
    card.classList.add('correct');
    state.caseState.step = 2;
    showToast('success', '🎯', `Correct! The criminal is ${suspect.name}`);
    updateSteps();
    setTimeout(() => {
      document.getElementById('root-cause-section').style.display = 'block';
      renderReasons(c);
      document.getElementById('root-cause-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Reveal clue 2 automatically
      if (state.caseState.cluesRevealed < 2) {
        state.caseState.cluesRevealed = Math.max(state.caseState.cluesRevealed, 2);
        renderEvidence(c);
      }
    }, 400);
  } else {
    card.classList.add('wrong');
    showToast('error', '❌', `Wrong! ${suspect.name} is not the culprit. Keep investigating.`);
    state.caseState.suspectSelected = null;
    setTimeout(() => card.classList.remove('wrong'), 800);
  }
}

function renderReasons(c) {
  const container = document.getElementById('reason-options');
  container.innerHTML = '';
  c.reasons.forEach((r, i) => {
    const div = document.createElement('div');
    div.className = 'reason-option';
    div.id = `reason-${i}`;
    div.innerHTML = `<div class="reason-radio"></div><span>${r.text}</span>`;
    div.addEventListener('click', () => selectReason(i, r, c));
    container.appendChild(div);
  });
}

function selectReason(i, reason, c) {
  if (state.caseState.reasonSelected !== null) return;

  state.caseState.reasonSelected = i;
  const el = document.getElementById(`reason-${i}`);

  if (reason.correct) {
    el.classList.add('correct');
    state.caseState.step = 3;
    showToast('success', '💡', 'Root cause identified!');
    updateSteps();
    setTimeout(() => {
      document.getElementById('code-fix-section').style.display = 'block';
      renderFixes(c);
      document.getElementById('code-fix-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (state.caseState.cluesRevealed < 3) {
        state.caseState.cluesRevealed = 3;
        renderEvidence(c);
      }
    }, 400);
  } else {
    el.classList.add('wrong');
    showToast('error', '❌', 'Incorrect reasoning. Try another theory.');
    state.caseState.reasonSelected = null;
    setTimeout(() => el.classList.remove('wrong'), 800);
  }
}

function renderFixes(c) {
  const container = document.getElementById('fix-options');
  container.innerHTML = '';
  c.fixes.forEach((f, i) => {
    const div = document.createElement('div');
    div.className = 'fix-option';
    div.id = `fix-${i}`;
    div.innerHTML = `<span class="fix-prefix">→</span><code>${f.text}</code>`;
    div.addEventListener('click', () => selectFix(i, f));
    container.appendChild(div);
  });
}

function selectFix(i, fix) {
  if (state.caseState.fixSelected !== null) return;
  state.caseState.fixSelected = i;
  const el = document.getElementById(`fix-${i}`);

  if (fix.correct) {
    el.classList.add('correct');
    showToast('success', '🔧', 'Correct fix applied! Submit the case.');
    setTimeout(() => {
      document.getElementById('submit-section').style.display = 'block';
      document.getElementById('submit-section').scrollIntoView({ behavior: 'smooth' });
    }, 400);
  } else {
    el.classList.add('wrong');
    showToast('error', '❌', 'This fix won\'t solve the bug. Try another patch.');
    state.caseState.fixSelected = null;
    setTimeout(() => el.classList.remove('wrong'), 800);
  }
}

function updateSteps() {
  const steps = [1, 2, 3];
  steps.forEach(n => {
    const el = document.getElementById(`step-${n}`);
    el.classList.remove('active', 'done');
    if (n < state.caseState.step) el.classList.add('done');
    else if (n === state.caseState.step) el.classList.add('active');
  });
}

function submitCase() {
  const c = CASES[state.currentCaseIndex];
  const xpGain = c.xpReward;
  const oldXP = state.totalXP;
  state.totalXP += xpGain;
  state.casesCompleted += 1;
  state.streak = state.streak; // keep streak

  // Update modal
  document.getElementById('modal-xp-value').textContent = `+${xpGain} DXP`;
  document.getElementById('modal-subtitle').textContent = `${c.criminal} has been apprehended. Case ${c.id} officially closed.`;
  document.getElementById('modal-cases-solved').textContent = state.casesCompleted;
  document.getElementById('modal-streak').textContent = state.streak + '🔥';

  // Animate XP
  const xpEl = document.getElementById('modal-total-xp');
  xpEl.textContent = formatXP(oldXP);
  document.getElementById('modal-overlay').classList.add('active');

  setTimeout(() => {
    animateNumber(xpEl, oldXP, state.totalXP);
    spawnParticles();
  }, 300);

  // Update nav XP
  document.getElementById('nav-xp').textContent = formatXP(state.totalXP) + ' DXP';
  document.getElementById('sidebar-xp').textContent = formatXP(state.totalXP);
  updateDashboard();
}

function spawnParticles() {
  const modal = document.getElementById('case-closed-modal');
  const colors = ['var(--cyan)', 'var(--amber)', 'var(--crimson)', 'var(--green)', 'var(--purple)'];
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const angle = (Math.random() * 360) * (Math.PI / 180);
    const dist = 60 + Math.random() * 120;
    p.style.cssText = `
      left: 50%; top: 30%;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      --tx: ${Math.cos(angle) * dist}px;
      --ty: ${Math.sin(angle) * dist}px;
      animation-delay: ${Math.random() * 0.3}s;
      animation-duration: ${0.6 + Math.random() * 0.6}s;
    `;
    modal.appendChild(p);
    setTimeout(() => p.remove(), 1200);
  }
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
  showScreen('dashboard');
}

function nextCase() {
  document.getElementById('modal-overlay').classList.remove('active');
  if (state.currentCaseIndex < CASES.length - 1) {
    state.currentCaseIndex++;
  } else {
    showToast('info', '🏆', 'You\'ve completed all available cases! More coming soon.');
    showScreen('dashboard');
    return;
  }
  showScreen('crime-scene');
}

function prevCase() {
  if (state.currentCaseIndex > 0) {
    state.currentCaseIndex--;
    showScreen('crime-scene');
  }
}

// =============================================
// CRIMINAL DATABASE
// =============================================
function renderCriminalDatabase() {
  const grid = document.getElementById('criminals-grid');
  grid.innerHTML = '';
  const unlocked = CRIMINALS.filter(c => c.unlocked).length;
  document.getElementById('unlocked-count').textContent = `${unlocked} Unlocked`;

  CRIMINALS.forEach(criminal => {
    const card = document.createElement('div');
    card.className = 'criminal-card';
    if (!criminal.unlocked) {
      card.style.opacity = '0.4';
      card.style.filter = 'grayscale(0.8)';
    }
    card.style.borderColor = criminal.unlocked ? criminal.borderColor : 'var(--border)';
    card.innerHTML = `
      <div class="criminal-card-top" style="--criminal-gradient: ${criminal.gradient}">
        ${!criminal.unlocked ? '<div style="position:absolute;top:12px;right:12px;font-size:20px;">🔒</div>' : ''}
        <div class="criminal-mugshot">${criminal.icon}</div>
        <div class="criminal-alias">${criminal.alias}</div>
        <div class="criminal-class">${criminal.exceptionClass}</div>
        <div class="criminal-solved">
          <span>Cases closed:</span>
          <span class="criminal-solved-count">&nbsp;${criminal.solvedCount}</span>
        </div>
      </div>
      <div class="criminal-card-bottom">
        <div class="criminal-attack-label">Attack Pattern</div>
        <div class="criminal-code-snippet">${criminal.attack}</div>
        <div class="criminal-root-cause">${criminal.unlocked ? criminal.cause : '🔒 Solve more cases to unlock criminal profile.'}</div>
      </div>
    `;
    if (criminal.unlocked) {
      card.addEventListener('click', () => showToast('info', criminal.icon, `${criminal.alias} — ${criminal.exceptionClass}`));
    }
    grid.appendChild(card);
  });
}

// =============================================
// MASTERY BOARD
// =============================================
function renderMasteryBoard() {
  const list = document.getElementById('mastery-topics-list');
  list.innerHTML = '';

  MASTERY_TOPICS.forEach(t => {
    const row = document.createElement('div');
    row.className = 'mastery-topic-row';
    row.innerHTML = `
      <div class="mastery-row-header">
        <div class="mastery-topic-info">
          <div class="mastery-icon">${t.icon}</div>
          <div>
            <div class="mastery-name">${t.name}</div>
            <div class="mastery-cases">${t.locked ? 'Locked' : `${t.solved}/${t.total} cases · ${t.accuracy}% accuracy`}</div>
          </div>
        </div>
        <div class="mastery-percentage" style="color:${t.locked ? 'var(--text-muted)' : t.color}">
          ${t.locked ? '–' : t.pct + '%'}
        </div>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width:${t.pct}%; background: linear-gradient(90deg, ${t.color}, ${t.locked ? 'transparent' : 'var(--purple)'});"></div>
      </div>
      ${t.locked ? '<div style="margin-top:10px;"><span class="badge badge-crimson">🔒 Locked</span></div>' : ''}
    `;
    list.appendChild(row);
  });

  // Recommendations
  const recList = document.getElementById('recommendations');
  recList.innerHTML = '';
  MASTERY_TOPICS.filter(t => t.recommended && !t.locked).forEach(t => {
    const div = document.createElement('div');
    div.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px; padding:10px 12px; background:rgba(255,255,255,0.02); border-radius:var(--radius-md); border:1px solid var(--border); cursor:pointer;" onclick="showScreen('crime-scene')">
        <span style="font-size:18px;">${t.icon}</span>
        <div>
          <div style="font-size:13px; font-weight:600;">${t.name}</div>
          <div style="font-size:11px; color:var(--text-muted);">${t.pct}% mastery · Practice needed</div>
        </div>
        <span style="margin-left:auto; color:var(--cyan); font-size:12px;">→</span>
      </div>
    `;
    recList.appendChild(div);
  });

  // Rank progression
  const rankProg = document.getElementById('rank-progression');
  rankProg.innerHTML = '';
  RANKS.forEach((rank, i) => {
    const achieved = state.totalXP >= rank.threshold;
    const isCurrent = getRank(state.totalXP).name === rank.name;
    const div = document.createElement('div');
    div.style.cssText = 'display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:8px;';
    if (isCurrent) div.style.background = 'rgba(0, 243, 255, 0.06)';
    div.innerHTML = `
      <span style="font-size:16px;">${rank.icon}</span>
      <div style="flex:1;">
        <div style="font-size:12px; font-weight:600; color:${achieved ? 'var(--text-primary)' : 'var(--text-muted)'};">${rank.name}</div>
        <div style="font-size:10px; color:var(--text-muted);">${rank.threshold.toLocaleString()} DXP</div>
      </div>
      ${achieved ? '<span style="color:var(--green); font-size:14px;">✓</span>' : ''}
      ${isCurrent ? '<span class="badge badge-cyan" style="font-size:9px;">NOW</span>' : ''}
    `;
    rankProg.appendChild(div);
  });

  // Update stat cards
  document.getElementById('mastery-total-xp').textContent = formatXP(state.totalXP);
  document.getElementById('mastery-cases-solved').textContent = state.casesCompleted;
  document.getElementById('mastery-accuracy').textContent = state.accuracy + '%';
  document.getElementById('mastery-streak').textContent = state.streak;
}

// =============================================
// INITIALIZATION
// =============================================
function init() {
  updateDashboard();
  renderCriminalDatabase();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
