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
    id: 'U1-01',
    title: 'The Overflowing Evidence',
    topic: 'DATA_TYPES',
    difficulty: 'Rookie',
    difficultyColor: 'green',
    xpReward: 100,
    filename: 'Investigation.java',
    description: 'Java data types and integer overflow.',
    bannerSnippet: '<span class="text-crimson">evidence++</span>;',
    code: [
        { text: '<span class="type">byte</span> evidence = <span class="number">127</span>;', bug: false },
        { text: 'evidence++;', bug: true },
        { text: '<span class="class-name">System</span>.<span class="variable">out</span>.<span class="method">println</span>(evidence);', bug: false }
      ],
    clues: [
        { text: 'The variable \'evidence\' is declared as a byte.', icon: '🔍' },
        { text: 'A byte in Java is an 8-bit signed integer.', icon: '💾' },
        { text: 'The maximum value for a byte is 127. Incrementing past it causes an overflow to its minimum value (-128).', icon: '🌊' }
      ],
    suspects: [
        { name: 'NullPointerException', icon: '💀', correct: false },
        { name: 'Numeric overflow', icon: '🌊', correct: true },
        { name: 'Compilation Error', icon: '❌', correct: false },
        { name: 'Syntax Error', icon: '🚫', correct: false }
      ],
    reasons: [
        { text: 'Byte only holds positive numbers', correct: false },
        { text: 'Exceeding the maximum positive limit wraps around to the negative limit', correct: true },
        { text: 'Java doesn\'t support the ++ operator on bytes', correct: false },
        { text: '127 is already negative in byte representation', correct: false }
      ],
    fixes: [
        { text: 'int evidence = 127;', correct: true },
        { text: 'byte evidence = 128;', correct: false },
        { text: 'short evidence = 32000;', correct: false },
        { text: 'char evidence = 127;', correct: false }
      ],
    detectorNote: 'What is the maximum positive value of a byte? What happens if you add 1?',
    criminal: 'Numeric overflow'
  },
  {
    id: 'U1-02',
    title: 'The Array Boundary Breach',
    topic: 'ARRAYS',
    difficulty: 'Rookie',
    difficultyColor: 'green',
    xpReward: 100,
    filename: 'Records.java',
    description: 'Accessing an array out of its bounds.',
    bannerSnippet: 'System.out.println(<span class="text-crimson">marks[3]</span>);',
    code: [
        { text: '<span class="type">int</span>[] marks = {<span class="number">80</span>, <span class="number">90</span>, <span class="number">70</span>};', bug: false },
        { text: '', bug: false },
        { text: '<span class="class-name">System</span>.<span class="variable">out</span>.<span class="method">println</span>(marks[<span class="number">3</span>]);', bug: true }
      ],
    clues: [
        { text: 'The array \'marks\' has exactly 3 elements.', icon: '🔍' },
        { text: 'Java arrays are zero-indexed, meaning the first element is at index 0.', icon: '0️⃣' },
        { text: 'The valid indices for this array are 0, 1, and 2. Index 3 does not exist.', icon: '🚫' }
      ],
    suspects: [
        { name: 'ArrayIndexOutOfBoundsException', icon: '📊', correct: true },
        { name: 'NullPointerException', icon: '💀', correct: false },
        { name: 'TypeMismatch', icon: '🎭', correct: false },
        { name: 'Compilation Error', icon: '❌', correct: false }
      ],
    reasons: [
        { text: 'The array hasn\'t been initialized', correct: false },
        { text: 'You are requesting index 3, but the maximum valid index is 2', correct: true },
        { text: 'System.out.println cannot print integers', correct: false },
        { text: 'The array syntax is incorrect', correct: false }
      ],
    fixes: [
        { text: 'System.out.println(marks[2]);', correct: true },
        { text: 'System.out.println(marks[4]);', correct: false },
        { text: 'System.out.println(marks);', correct: false },
        { text: 'System.out.println(marks.get(3));', correct: false }
      ],
    detectorNote: 'If length = 3, what are the valid indexes?',
    criminal: 'ArrayIndexOutOfBoundsException'
  },
  {
    id: 'U1-03',
    title: 'The Assignment Impostor',
    topic: 'OPERATORS',
    difficulty: 'Rookie',
    difficultyColor: 'green',
    xpReward: 100,
    filename: 'total_dxp.java',
    description: 'Operator precedence and compound assignment.',
    bannerSnippet: 'total_dxp <span class="text-crimson">+=</span> 10 * 2;',
    code: [
        { text: '<span class="type">int</span> total_dxp = <span class="number">50</span>;', bug: false },
        { text: 'total_dxp += <span class="number">10</span> * <span class="number">2</span>;', bug: true },
        { text: '<span class="class-name">System</span>.<span class="variable">out</span>.<span class="method">println</span>(total_dxp);', bug: false }
      ],
    clues: [
        { text: 'The total_dxp starts at 50.', icon: '🔍' },
        { text: 'Multiplication (*) has a higher precedence than compound assignment (+=).', icon: '⚖️' },
        { text: 'First, 10 * 2 is evaluated (20). Then, 20 is added to 50.', icon: '🧮' }
      ],
    suspects: [
        { name: '70', icon: '🎯', correct: true },
        { name: '120', icon: '❌', correct: false },
        { name: '100', icon: '❌', correct: false },
        { name: '60', icon: '❌', correct: false }
      ],
    reasons: [
        { text: '(50 + 10) * 2 = 120', correct: false },
        { text: 'Multiplication executes first (10*2=20), then addition assignment (50+20=70)', correct: true },
        { text: 'The compound operator just overrides the variable', correct: false },
        { text: 'total_dxp is unchanged', correct: false }
      ],
    fixes: [
        { text: 'The correct output is 70', correct: true },
        { text: 'The correct output is 120', correct: false },
        { text: 'The correct output is 100', correct: false },
        { text: 'The correct output is 60', correct: false }
      ],
    detectorNote: 'Remember PEMDAS! Does multiplication or assignment happen first?',
    criminal: 'Operator Precedence'
  },
  {
    id: 'U1-04',
    title: 'The Unreachable Branch',
    topic: 'CONTROL_STATEMENTS',
    difficulty: 'Code Investigator',
    difficultyColor: 'amber',
    xpReward: 150,
    filename: 'Grader.java',
    description: 'Incorrect condition ordering in an if-else chain.',
    bannerSnippet: '<span class="text-crimson">if (marks >= 40)</span>',
    code: [
        { text: '<span class="type">int</span> marks = <span class="number">85</span>;', bug: false },
        { text: '', bug: false },
        { text: '<span class="keyword">if</span> (marks >= <span class="number">40</span>)', bug: true },
        { text: '    <span class="class-name">System</span>.<span class="variable">out</span>.<span class="method">println</span>(<span class="string">"Pass"</span>);', bug: false },
        { text: '<span class="keyword">else if</span> (marks >= <span class="number">75</span>)', bug: true },
        { text: '    <span class="class-name">System</span>.<span class="variable">out</span>.<span class="method">println</span>(<span class="string">"Distinction"</span>);', bug: false }
      ],
    clues: [
        { text: 'The \'marks\' variable is 85, which means they should get a Distinction.', icon: '🔍' },
        { text: 'An if-else chain evaluates from top to bottom and stops at the FIRST true condition.', icon: '⚖️' },
        { text: 'Because 85 >= 40 is true, the first block executes and the rest are ignored.', icon: '⚠️' }
      ],
    suspects: [
        { name: 'Variable shadowing', icon: '👥', correct: false },
        { name: 'Incorrect condition ordering', icon: '🔀', correct: true },
        { name: 'Compilation Error', icon: '❌', correct: false },
        { name: 'NullPointerException', icon: '💀', correct: false }
      ],
    reasons: [
        { text: 'Java evaluates multiple true conditions but only prints the first one', correct: false },
        { text: 'The broader condition is placed before the stricter condition, shadowing it', correct: true },
        { text: 'Missing curly braces {}', correct: false },
        { text: 'else if is not valid in Java', correct: false }
      ],
    fixes: [
        { text: 'if (marks >= 75) { ... } else if (marks >= 40) { ... }', correct: true },
        { text: 'if (marks >= 40 && marks >= 75)', correct: false },
        { text: 'if (marks == 75)', correct: false },
        { text: 'else if (marks >= 85)', correct: false }
      ],
    detectorNote: 'In an if-else chain, put the most specific or hardest-to-reach condition first!',
    criminal: 'Incorrect condition ordering'
  },
  {
    id: 'U1-05',
    title: 'The Missing Blueprint',
    topic: 'CLASSES_OBJECTS',
    difficulty: 'Rookie',
    difficultyColor: 'green',
    xpReward: 100,
    filename: 'Main.java',
    description: 'Code Reconstruction of Classes and Objects.',
    bannerSnippet: '<span class="text-crimson">Student s = new Student();</span>',
    code: [
        { text: '<span class="comment">// Fragmented Code:</span>', bug: false },
        { text: 'Student s = new Student();', bug: true },
        { text: 'class Student {', bug: true },
        { text: 's.display();', bug: true },
        { text: 'void display() { }', bug: true },
        { text: '}', bug: true }
      ],
    clues: [
        { text: 'The code is scrambled. A class must encapsulate its methods.', icon: '🧩' },
        { text: 'The object creation and method call must happen inside a method like \'main\', not inside another class structure at the top level.', icon: '🏗️' },
        { text: 'The method display() belongs inside the Student class.', icon: '📦' }
      ],
    suspects: [
        { name: 'Syntax Error', icon: '🚫', correct: false },
        { name: 'Missing Blueprint (Class structure error)', icon: '🏗️', correct: true },
        { name: 'NullPointerException', icon: '💀', correct: false },
        { name: 'Private method access', icon: '🔒', correct: false }
      ],
    reasons: [
        { text: 'The student object needs to be created inside the class definition', correct: false },
        { text: 'Object creation must happen in a method (like main) and the class needs its methods enclosed', correct: true },
        { text: 'The display method is not public', correct: false },
        { text: 'There are no variables', correct: false }
      ],
    fixes: [
        { text: 'class Student { void display(){} } // and in main: Student s = new Student(); s.display();', correct: true },
        { text: 'class Student s = new Student();', correct: false },
        { text: 'Student s = class Student { void display(){} };', correct: false },
        { text: 'void display() { Student s = new Student(); } class Student {}', correct: false }
      ],
    detectorNote: 'A class is the blueprint. An object is the house. You can\'t build the house without reading the blueprint first.',
    criminal: 'Missing Blueprint'
  },
  {
    id: 'U1-06',
    title: 'The Constructor Without Identity',
    topic: 'CONSTRUCTORS',
    difficulty: 'Rookie',
    difficultyColor: 'green',
    xpReward: 100,
    filename: 'Student.java',
    description: 'Constructor argument mismatch.',
    bannerSnippet: 'Student s = <span class="text-crimson">new Student()</span>;',
    code: [
        { text: '<span class="keyword">class</span> <span class="class-name">Student</span> {', bug: false },
        { text: '    <span class="class-name">Student</span>(<span class="type">String</span> name) {', bug: false },
        { text: '        <span class="class-name">System</span>.<span class="variable">out</span>.<span class="method">println</span>(name);', bug: false },
        { text: '    }', bug: false },
        { text: '}', bug: false },
        { text: '', bug: false },
        { text: '<span class="class-name">Student</span> s = <span class="keyword">new</span> <span class="class-name">Student</span>();', bug: true }
      ],
    clues: [
        { text: 'The Student class defines a constructor that expects a String.', icon: '🔍' },
        { text: 'When you write a custom constructor, Java removes the hidden default empty constructor.', icon: '🗑️' },
        { text: 'The instantiation calls new Student(), passing NO arguments.', icon: '⚠️' }
      ],
    suspects: [
        { name: 'Constructor mismatch', icon: '🏗️', correct: true },
        { name: 'Variable shadowing', icon: '👥', correct: false },
        { name: 'NullPointerException', icon: '💀', correct: false },
        { name: 'Runtime Polymorphism', icon: '🎭', correct: false }
      ],
    reasons: [
        { text: 'The name string must be initialized before creating the object', correct: false },
        { text: 'The instantiation is missing the required String argument', correct: true },
        { text: 'The Student class lacks an abstract constructor', correct: false },
        { text: 'Strings cannot be printed inside constructors', correct: false }
      ],
    fixes: [
        { text: 'Student s = new Student("Arun");', correct: true },
        { text: 'Student s = new Student(123);', correct: false },
        { text: 'Student s = new Student;', correct: false },
        { text: 'Student s = null;', correct: false }
      ],
    detectorNote: 'Java gives you a free empty constructor ONLY if you don\'t build one yourself.',
    criminal: 'Constructor Mismatch'
  },
  {
    id: 'U1-07',
    title: 'The Missing Return',
    topic: 'METHODS',
    difficulty: 'Rookie',
    difficultyColor: 'green',
    xpReward: 100,
    filename: 'MathCalc.java',
    description: 'A method promises a return value but fails to deliver.',
    bannerSnippet: 'static <span class="text-crimson">int</span> add(int a, int b)',
    code: [
        { text: '<span class="keyword">static int</span> <span class="method">add</span>(<span class="type">int</span> a, <span class="type">int</span> b) {', bug: false },
        { text: '    <span class="type">int</span> result = a + b;', bug: true },
        { text: '}', bug: true }
      ],
    clues: [
        { text: 'The method signature declares \'int\' as the return type.', icon: '🔍' },
        { text: 'The method calculates the sum and stores it in \'result\'.', icon: '🧮' },
        { text: 'The method ends without sending anything back to the caller.', icon: '🚫' }
      ],
    suspects: [
        { name: 'Missing inheritance', icon: '🧬', correct: false },
        { name: 'Missing return statement', icon: '📤', correct: true },
        { name: 'TypeMismatch', icon: '🎭', correct: false },
        { name: 'Syntax Error', icon: '❌', correct: false }
      ],
    reasons: [
        { text: 'If a method return type is not void, it MUST use a return statement', correct: true },
        { text: 'The result variable is private', correct: false },
        { text: 'Static methods cannot return values', correct: false },
        { text: 'You cannot declare local variables in static methods', correct: false }
      ],
    fixes: [
        { text: 'return result;', correct: true },
        { text: 'return void;', correct: false },
        { text: 'System.out.println(result);', correct: false },
        { text: 'break result;', correct: false }
      ],
    detectorNote: 'When you promise a type in the method signature, you must return it!',
    criminal: 'Missing Return'
  },
  {
    id: 'U1-08',
    title: 'The Private Vault',
    topic: 'ACCESS_SPECIFIERS',
    difficulty: 'Code Investigator',
    difficultyColor: 'amber',
    xpReward: 150,
    filename: 'Account.java',
    description: 'Illegal private-member access.',
    bannerSnippet: 'System.out.println(<span class="text-crimson">account.balance</span>);',
    code: [
        { text: '<span class="keyword">class</span> <span class="class-name">Account</span> {', bug: false },
        { text: '    <span class="keyword">private</span> <span class="type">double</span> balance = <span class="number">5000</span>;', bug: false },
        { text: '}', bug: false },
        { text: '', bug: false },
        { text: '<span class="class-name">Account</span> account = <span class="keyword">new</span> <span class="class-name">Account</span>();', bug: false },
        { text: '<span class="class-name">System</span>.<span class="variable">out</span>.<span class="method">println</span>(account.balance);', bug: true }
      ],
    clues: [
        { text: 'The balance field belongs to Account.', icon: '🔍' },
        { text: 'The balance field is marked as private.', icon: '🔒' },
        { text: 'The main method is trying to access balance directly from outside the class.', icon: '⚠️' }
      ],
    suspects: [
        { name: 'Variable shadowing', icon: '👥', correct: false },
        { name: 'NullPointerException', icon: '💀', correct: false },
        { name: 'Encapsulation Violation', icon: '🔒', correct: true },
        { name: 'Constructor Mismatch', icon: '🏗️', correct: false }
      ],
    reasons: [
        { text: 'Private fields are hidden and cannot be accessed outside the class directly', correct: true },
        { text: 'Account object was not initialized properly', correct: false },
        { text: 'System.out.println only accepts Strings', correct: false },
        { text: 'Double values need to be cast to int', correct: false }
      ],
    fixes: [
        { text: '// Inside Account: public double getBalance() { return balance; } // Usage: account.getBalance()', correct: true },
        { text: 'System.out.println(account->balance);', correct: false },
        { text: 'System.out.println(Account.balance);', correct: false },
        { text: 'System.out.println(balance);', correct: false }
      ],
    detectorNote: 'Private means "keep out". You need a public getter method to access it safely.',
    criminal: 'Encapsulation Violation'
  },
  {
    id: 'U1-09',
    title: 'The Shared Counter Mystery',
    topic: 'STATIC_MEMBERS',
    difficulty: 'Code Investigator',
    difficultyColor: 'amber',
    xpReward: 150,
    filename: 'Student.java',
    description: 'Determine the output of a shared static counter.',
    bannerSnippet: '<span class="text-crimson">static int count = 0;</span>',
    code: [
        { text: '<span class="keyword">class</span> <span class="class-name">Student</span> {', bug: false },
        { text: '    <span class="keyword">static int</span> count = <span class="number">0</span>;', bug: false },
        { text: '    <span class="class-name">Student</span>() {', bug: false },
        { text: '        count++;', bug: false },
        { text: '    }', bug: false },
        { text: '}', bug: false },
        { text: '<span class="class-name">Student</span> s1 = <span class="keyword">new</span> <span class="class-name">Student</span>();', bug: false },
        { text: '<span class="class-name">Student</span> s2 = <span class="keyword">new</span> <span class="class-name">Student</span>();', bug: false },
        { text: '<span class="class-name">Student</span> s3 = <span class="keyword">new</span> <span class="class-name">Student</span>();', bug: false },
        { text: '<span class="class-name">System</span>.<span class="variable">out</span>.<span class="method">println</span>(<span class="class-name">Student</span>.count);', bug: true }
      ],
    clues: [
        { text: 'The count variable is declared as \'static\'.', icon: '🌟' },
        { text: 'There are three objects created: s1, s2, and s3.', icon: '👤' },
        { text: 'Static variables are shared among all instances of the class.', icon: '📈' }
      ],
    suspects: [
        { name: '3', icon: '🎯', correct: true },
        { name: '1', icon: '❌', correct: false },
        { name: '0', icon: '❌', correct: false },
        { name: 'Compilation Error', icon: '🚫', correct: false }
      ],
    reasons: [
        { text: 'Each object gets its own copy of count, so they are all 1', correct: false },
        { text: 'Static means one shared copy. Every new Student increments the same counter.', correct: true },
        { text: 'Static variables cannot be incremented', correct: false },
        { text: 'Student.count is an invalid access method', correct: false }
      ],
    fixes: [
        { text: 'The output is 3.', correct: true },
        { text: 'The output is 1.', correct: false },
        { text: 'The output is 0.', correct: false },
        { text: 'Throws exception.', correct: false }
      ],
    detectorNote: 'Static means "class-level". All objects share the same memory location for it.',
    criminal: 'Static State Mutator'
  },
  {
    id: 'U1-10',
    title: 'The Undocumented Evidence',
    topic: 'JAVADOC',
    difficulty: 'Rookie',
    difficultyColor: 'green',
    xpReward: 100,
    filename: 'Utils.java',
    description: 'Identify the correct JavaDoc format.',
    bannerSnippet: '<span class="text-crimson">// Calculates the total</span>',
    code: [
        { text: '<span class="comment">// Calculates the total</span>', bug: true },
        { text: '<span class="keyword">int</span> <span class="method">calculateTotal</span>(<span class="type">int</span> a, <span class="type">int</span> b) {', bug: false },
        { text: '    <span class="keyword">return</span> a + b;', bug: false },
        { text: '}', bug: false }
      ],
    clues: [
        { text: 'The current comment uses a double slash // which is a single-line comment.', icon: '📝' },
        { text: 'JavaDoc comments must start with /** and end with */.', icon: '📜' },
        { text: 'JavaDoc uses tags like @param and @return to generate API documentation.', icon: '🏷️' }
      ],
    suspects: [
        { name: 'Incorrect Comment Format', icon: '❌', correct: true },
        { name: 'Missing Blueprint', icon: '🏗️', correct: false },
        { name: 'Syntax Error', icon: '🚫', correct: false },
        { name: 'TypeMismatch', icon: '🎭', correct: false }
      ],
    reasons: [
        { text: 'JavaDoc requires a specific block format for the javadoc tool to recognize it', correct: true },
        { text: 'Single line comments cause compilation errors in Java', correct: false },
        { text: 'The method is missing a return statement', correct: false },
        { text: 'The method should be static to have JavaDoc', correct: false }
      ],
    fixes: [
        { text: '/**\n * Calculates the total.\n * @param a first value\n * @param b second value\n * @return calculated total\n */', correct: true },
        { text: '/* Calculates the total @param a @param b */', correct: false },
        { text: '/// Calculates the total\n/// @param a\n/// @param b', correct: false },
        { text: '<!-- Calculates the total -->', correct: false }
      ],
    detectorNote: 'JavaDoc is what creates those nice web pages explaining what methods do. It needs the /** format.',
    criminal: 'Incorrect Comment Format'
  },
  {
    id: 'U2-01',
    title: 'The Overload Impostor',
    topic: 'OOP_DIVISION',
    difficulty: 'Code Investigator',
    difficultyColor: 'amber',
    xpReward: 150,
    filename: 'Investigation.java',
    description: 'Invalid method overloading by only changing the return type.',
    bannerSnippet: '<span class="text-crimson">int</span> investigate(int evidence)',
    code: [
        { text: '<span class="keyword">void</span> <span class="method">investigate</span>(<span class="type">int</span> evidence) {', bug: false },
        { text: '    <span class="comment">// Analyze evidence</span>', bug: false },
        { text: '}', bug: false },
        { text: '', bug: false },
        { text: '<span class="type">int</span> <span class="method">investigate</span>(<span class="type">int</span> evidence) {', bug: true },
        { text: '    <span class="keyword">return</span> evidence;', bug: true },
        { text: '}', bug: true }
      ],
    clues: [
        { text: 'Both methods share the same name \'investigate\'.', icon: '🔍' },
        { text: 'Both methods have the exact same parameter list: (int evidence).', icon: '⚖️' },
        { text: 'The return types are different, but Java method signatures only care about the name and parameter list.', icon: '📝' }
      ],
    suspects: [
        { name: 'Variable shadowing', icon: '👥', correct: false },
        { name: 'Compilation Error (Duplicate Method)', icon: '❌', correct: true },
        { name: 'Missing inheritance', icon: '🧬', correct: false },
        { name: 'Runtime Polymorphism', icon: '🎭', correct: false }
      ],
    reasons: [
        { text: 'Java allows overloading only if the return type is different', correct: false },
        { text: 'Changing only the return type does not create an overloaded method', correct: true },
        { text: 'Methods cannot take ints as parameters', correct: false },
        { text: 'One method must be marked as static', correct: false }
      ],
    fixes: [
        { text: 'int investigate(int evidence, boolean detailed) { return evidence; }', correct: true },
        { text: 'int Investigate(int evidence) { return evidence; }', correct: false },
        { text: 'void investigate(int evidence) { return evidence; }', correct: false },
        { text: 'double investigate(int evidence) { return evidence; }', correct: false }
      ],
    detectorNote: 'Method signatures are like fingerprints: name + parameters. The return type is NOT part of the fingerprint.',
    criminal: 'Duplicate Method Signature'
  },
  {
    id: 'U2-02',
    title: 'The Altered Evidence',
    topic: 'OOP_DIVISION',
    difficulty: 'Code Investigator',
    difficultyColor: 'amber',
    xpReward: 150,
    filename: 'Lab.java',
    description: 'Understanding object references as method parameters.',
    bannerSnippet: 'tamperEvidence(<span class="text-cyan">suspect</span>);',
    code: [
        { text: '<span class="keyword">class</span> <span class="class-name">Student</span> { <span class="type">String</span> name = <span class="string">"Innocent"</span>; }', bug: false },
        { text: '', bug: false },
        { text: '<span class="keyword">static void</span> <span class="method">tamperEvidence</span>(<span class="class-name">Student</span> s) {', bug: false },
        { text: '    s.name = <span class="string">"Guilty"</span>;', bug: false },
        { text: '}', bug: false },
        { text: '', bug: false },
        { text: '<span class="class-name">Student</span> suspect = <span class="keyword">new</span> <span class="class-name">Student</span>();', bug: false },
        { text: '<span class="method">tamperEvidence</span>(suspect);', bug: false },
        { text: '<span class="class-name">System</span>.<span class="variable">out</span>.<span class="method">println</span>(suspect.name);', bug: true }
      ],
    clues: [
        { text: 'The object \'suspect\' is created with the name \'Innocent\'.', icon: '🔍' },
        { text: 'It is passed into the \'tamperEvidence\' method.', icon: '🧪' },
        { text: 'Java passes object references by value. The method gets a copy of the reference pointing to the SAME object in memory.', icon: '🔗' }
      ],
    suspects: [
        { name: '"Innocent"', icon: '😇', correct: false },
        { name: '"Guilty"', icon: '😈', correct: true },
        { name: 'NullPointerException', icon: '💀', correct: false },
        { name: 'Compilation Error', icon: '❌', correct: false }
      ],
    reasons: [
        { text: 'The method creates a completely new copy of the Student object', correct: false },
        { text: 'The reference points to the original object, so modifying its fields modifies the original object', correct: true },
        { text: 'Strings are immutable, so the name cannot change', correct: false },
        { text: 'The suspect variable is out of scope', correct: false }
      ],
    fixes: [
        { text: 'The output is: Guilty', correct: true },
        { text: 'The output is: Innocent', correct: false },
        { text: 'Throws exception.', correct: false },
        { text: 'Compile error.', correct: false }
      ],
    detectorNote: 'When passing objects to methods, you are passing the keys to the house. The method can go in and change the furniture!',
    criminal: 'Reference Mutation'
  },
  {
    id: 'U2-03',
    title: 'The Returning Witness',
    topic: 'OOP_DIVISION',
    difficulty: 'Code Investigator',
    difficultyColor: 'amber',
    xpReward: 150,
    filename: 'Station.java',
    description: 'Returning objects from a method.',
    bannerSnippet: '<span class="text-crimson">________;</span>',
    code: [
        { text: '<span class="class-name">Student</span> <span class="method">createStudent</span>() {', bug: false },
        { text: '    <span class="class-name">Student</span> s = <span class="keyword">new</span> <span class="class-name">Student</span>();', bug: false },
        { text: '    <span class="keyword">________</span>;', bug: true },
        { text: '}', bug: false }
      ],
    clues: [
        { text: 'The method signature specifies the return type is \'Student\'.', icon: '🔍' },
        { text: 'A new \'Student\' object is instantiated and assigned to \'s\'.', icon: '👤' },
        { text: 'The method ends abruptly. It must return the created object to satisfy the contract.', icon: '📤' }
      ],
    suspects: [
        { name: 'Missing Return', icon: '📤', correct: true },
        { name: 'NullPointerException', icon: '💀', correct: false },
        { name: 'Abstract Instantiation', icon: '👻', correct: false },
        { name: 'Encapsulation Violation', icon: '🔒', correct: false }
      ],
    reasons: [
        { text: 'The method promises to output a Student but fails to return one', correct: true },
        { text: 'The \'s\' object is a String', correct: false },
        { text: 'Constructors don\'t need return types', correct: false },
        { text: 'The new keyword is missing', correct: false }
      ],
    fixes: [
        { text: 'return s;', correct: true },
        { text: 'return new Object();', correct: false },
        { text: 'System.out.println(s);', correct: false },
        { text: 'break;', correct: false }
      ],
    detectorNote: 'If the method says it gives you a Student, you better return the Student!',
    criminal: 'Missing Return'
  },
  {
    id: 'U2-04',
    title: 'The Hidden Room',
    topic: 'OOP_DIVISION',
    difficulty: 'Senior Investigator',
    difficultyColor: 'crimson',
    xpReward: 250,
    filename: 'Building.java',
    description: 'Constructing an inner class object.',
    bannerSnippet: 'Outer.Inner inner = <span class="text-crimson">new Inner()</span>;',
    code: [
        { text: '<span class="keyword">class</span> <span class="class-name">Outer</span> {', bug: false },
        { text: '    <span class="keyword">class</span> <span class="class-name">Inner</span> {', bug: false },
        { text: '        <span class="keyword">void</span> <span class="method">hide</span>() { }', bug: false },
        { text: '    }', bug: false },
        { text: '}', bug: false },
        { text: '', bug: false },
        { text: '<span class="class-name">Outer</span> outer = <span class="keyword">new</span> <span class="class-name">Outer</span>();', bug: false },
        { text: '<span class="class-name">Outer</span>.<span class="class-name">Inner</span> inner = <span class="keyword">new</span> <span class="class-name">Inner</span>();', bug: true }
      ],
    clues: [
        { text: 'The Inner class is NOT marked static. It is a non-static nested class.', icon: '🔍' },
        { text: 'A non-static inner class belongs to an INSTANCE of the outer class.', icon: '🏠' },
        { text: 'You cannot instantiate Inner directly without going through an Outer object.', icon: '🚫' }
      ],
    suspects: [
        { name: 'Invalid inner class instantiation', icon: '❌', correct: true },
        { name: 'Abstract Instantiation', icon: '👻', correct: false },
        { name: 'NullPointerException', icon: '💀', correct: false },
        { name: 'Variable shadowing', icon: '👥', correct: false }
      ],
    reasons: [
        { text: 'A non-static inner class requires an instance of its enclosing class to be instantiated', correct: true },
        { text: 'Inner is a protected class', correct: false },
        { text: 'You must use extends to access Inner', correct: false },
        { text: 'The hide method is private', correct: false }
      ],
    fixes: [
        { text: 'Outer.Inner inner = outer.new Inner();', correct: true },
        { text: 'Outer.Inner inner = Outer.new Inner();', correct: false },
        { text: 'Outer.Inner inner = new outer.Inner();', correct: false },
        { text: 'Outer.Inner inner = new Outer.Inner();', correct: false }
      ],
    detectorNote: 'You can\'t enter a room inside a house unless you enter the house first. Use \'outer.new Inner()\'.',
    criminal: 'Invalid Inner Instantiation'
  },
  {
    id: 'U2-05',
    title: 'The Inheritance Impostor',
    topic: 'OOP_DIVISION',
    difficulty: 'Rookie',
    difficultyColor: 'green',
    xpReward: 100,
    filename: 'Dog.java',
    description: 'Missing inheritance relationship.',
    bannerSnippet: 'Dog d = new Dog(); <span class="text-crimson">d.eat();</span>',
    code: [
        { text: '<span class="keyword">class</span> <span class="class-name">Animal</span> {', bug: false },
        { text: '    <span class="keyword">void</span> <span class="method">eat</span>() { }', bug: false },
        { text: '}', bug: false },
        { text: '', bug: false },
        { text: '<span class="keyword">class</span> <span class="class-name">Dog</span> {', bug: true },
        { text: '    <span class="keyword">void</span> <span class="method">bark</span>() { }', bug: false },
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
    criminal: 'Missing Inheritance'
  },
  {
    id: 'U2-06',
    title: 'The Parent Constructor Mystery',
    topic: 'OOP_DIVISION',
    difficulty: 'Code Investigator',
    difficultyColor: 'amber',
    xpReward: 150,
    filename: 'Student.java',
    description: 'Subclass fails to invoke the parent constructor properly.',
    bannerSnippet: 'Student() { <span class="text-crimson">// empty</span> }',
    code: [
        { text: '<span class="keyword">class</span> <span class="class-name">Person</span> {', bug: false },
        { text: '    <span class="class-name">Person</span>(<span class="type">String</span> name) {}', bug: false },
        { text: '}', bug: false },
        { text: '', bug: false },
        { text: '<span class="keyword">class</span> <span class="class-name">Student</span> <span class="keyword">extends</span> <span class="class-name">Person</span> {', bug: false },
        { text: '    <span class="class-name">Student</span>() {}', bug: true },
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
        { text: 'Student() { super("Unknown"); }', correct: true },
        { text: 'Student() { super(); }', correct: false },
        { text: 'Student() { Person.name = "Unknown"; }', correct: false },
        { text: 'Student() { this.name = "Unknown"; }', correct: false }
      ],
    detectorNote: 'If the parent has a specific constructor, the child MUST call it. How do we invoke a parent constructor?',
    criminal: 'Parent constructor mismatch'
  },
  {
    id: 'U2-07',
    title: 'The Silent Override',
    topic: 'OOP_DIVISION',
    difficulty: 'Code Investigator',
    difficultyColor: 'amber',
    xpReward: 150,
    filename: 'Animal.java',
    description: 'A method override fails silently due to a typo in the method signature.',
    bannerSnippet: 'void <span class="text-crimson">Sound()</span> { }',
    code: [
        { text: '<span class="keyword">class</span> <span class="class-name">Animal</span> {', bug: false },
        { text: '    <span class="keyword">void</span> <span class="method">sound</span>() { }', bug: false },
        { text: '}', bug: false },
        { text: '', bug: false },
        { text: '<span class="keyword">class</span> <span class="class-name">Dog</span> <span class="keyword">extends</span> <span class="class-name">Animal</span> {', bug: false },
        { text: '    <span class="keyword">void</span> <span class="method">Sound</span>() { }', bug: true },
        { text: '}', bug: false }
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
        { text: '@Override void sound() { }', correct: true },
        { text: 'void override sound() { }', correct: false },
        { text: 'void sound(String s) { }', correct: false },
        { text: 'public void Sound() { }', correct: false }
      ],
    detectorNote: 'What annotation can we use to ensure a method is genuinely overriding a parent method?',
    criminal: 'Incorrect method override'
  },
  {
    id: 'U2-08',
    title: 'The Identity Switch',
    topic: 'OOP_DIVISION',
    difficulty: 'Senior Investigator',
    difficultyColor: 'crimson',
    xpReward: 250,
    filename: 'Polymorphism.java',
    description: 'Understanding runtime polymorphism and method dispatch.',
    bannerSnippet: 'Animal suspect = <span class="text-cyan">new Dog()</span>; suspect.sound();',
    code: [
        { text: '<span class="keyword">class</span> <span class="class-name">Animal</span> { <span class="keyword">void</span> <span class="method">sound</span>() { <span class="class-name">System</span>.<span class="variable">out</span>.<span class="method">println</span>(<span class="string">"Animal"</span>); } }', bug: false },
        { text: '<span class="keyword">class</span> <span class="class-name">Dog</span> <span class="keyword">extends</span> <span class="class-name">Animal</span> { <span class="keyword">@Override</span> <span class="keyword">void</span> <span class="method">sound</span>() { <span class="class-name">System</span>.<span class="variable">out</span>.<span class="method">println</span>(<span class="string">"Dog"</span>); } }', bug: false },
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
        { name: '"Animal"', icon: '🐾', correct: false },
        { name: '"Dog"', icon: '🐕', correct: true },
        { name: 'Nothing', icon: '🕳️', correct: false }
      ],
    reasons: [
        { text: 'The compiler looks at the reference type, but runtime executes the actual object type\\\'s method', correct: true },
        { text: 'The Animal class method takes precedence', correct: false },
        { text: 'The Dog class cannot be assigned to an Animal reference', correct: false },
        { text: 'The program crashes because types don\\\'t match', correct: false }
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
    id: 'U2-09',
    title: 'The Abstract Fugitive',
    topic: 'OOP_DIVISION',
    difficulty: 'Senior Investigator',
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
        { name: 'Abstract Instantiation', icon: '👻', correct: true },
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
    detectorNote: 'Abstract classes are like blueprints without walls; you can\\\'t live in them until a concrete subclass builds them.',
    criminal: 'Abstract Instantiation'
  },
  {
    id: 'U2-10',
    title: 'The Package Contract',
    topic: 'OOP_DIVISION',
    difficulty: 'Senior Investigator',
    difficultyColor: 'crimson',
    xpReward: 300,
    filename: 'Card.java',
    description: 'Mini-Boss: Interfaces and Implementations.',
    bannerSnippet: 'class Card <span class="text-crimson">implements Payment</span>',
    code: [
        { text: '<span class="keyword">interface</span> <span class="class-name">Payment</span> {', bug: false },
        { text: '    <span class="keyword">void</span> <span class="method">pay</span>();', bug: false },
        { text: '}', bug: false },
        { text: '', bug: false },
        { text: '<span class="keyword">class</span> <span class="class-name">Card</span> <span class="keyword">implements</span> <span class="class-name">Payment</span> {', bug: true },
        { text: '    <span class="comment">// I will implement later...</span>', bug: true },
        { text: '}', bug: true }
      ],
    clues: [
        { text: 'Payment is an interface that specifies a pay() method.', icon: '📜' },
        { text: 'Card implements Payment but does not provide a body for pay().', icon: '❌' },
        { text: 'Implementing an interface is a strict contract to provide all its methods.', icon: '🤝' }
      ],
    suspects: [
        { name: 'Unimplemented Interface', icon: '🤝', correct: true },
        { name: 'Abstract Instantiation', icon: '👻', correct: false },
        { name: 'Missing inheritance', icon: '🧬', correct: false },
        { name: 'Variable shadowing', icon: '👥', correct: false }
      ],
    reasons: [
        { text: 'A concrete class must implement all methods of its interfaces', correct: true },
        { text: 'Interfaces cannot have methods', correct: false },
        { text: 'Card should use extends instead of implements', correct: false },
        { text: 'The pay() method should be private', correct: false }
      ],
    fixes: [
        { text: '@Override public void pay() { System.out.println("Payment made"); }', correct: true },
        { text: 'void pay() {}', correct: false },
        { text: 'abstract class Card implements Payment', correct: false },
        { text: 'public void display(Payment p) {}', correct: false }
      ],
    detectorNote: 'What method does the Payment interface require? Does Card have it?',
    criminal: 'Unimplemented Interface'
  },
  {
    id: 'U3-01',
    title: 'The Division Murder',
    topic: 'EXCEPTIONS_THREADS',
    difficulty: 'Rookie',
    difficultyColor: 'green',
    xpReward: 100,
    filename: 'Calculator.java',
    description: 'Exception Basics: Division by zero.',
    bannerSnippet: 'System.out.println(<span class="text-crimson">a / b</span>);',
    code: [
        { text: '<span class="type">int</span> a = <span class="number">100</span>;', bug: false },
        { text: '<span class="type">int</span> b = <span class="number">0</span>;', bug: false },
        { text: '', bug: false },
        { text: '<span class="class-name">System</span>.<span class="variable">out</span>.<span class="method">println</span>(a / b);', bug: true }
      ],
    clues: [
        { text: 'The variable \'a\' is 100.', icon: '🔍' },
        { text: 'The variable \'b\' is 0.', icon: '0️⃣' },
        { text: 'The math operation is division (/).', icon: '➗' }
      ],
    suspects: [
        { name: 'NullPointerException', icon: '💀', correct: false },
        { name: 'ArithmeticException', icon: '➗', correct: true },
        { name: 'ClassCastException', icon: '🎭', correct: false },
        { name: 'Syntax Error', icon: '❌', correct: false }
      ],
    reasons: [
        { text: 'Variables a and b are not initialized', correct: false },
        { text: 'Integer division by zero is mathematically undefined and throws an ArithmeticException', correct: true },
        { text: 'The division operator is incorrectly spelled', correct: false },
        { text: '0 is not an integer', correct: false }
      ],
    fixes: [
        { text: 'if (b != 0) System.out.println(a / b); else System.out.println("Cannot divide by 0");', correct: true },
        { text: 'System.out.println(a % b);', correct: false },
        { text: 'System.out.println(b / a);', correct: false },
        { text: 'System.out.println(a * b);', correct: false }
      ],
    detectorNote: 'What happens when you divide by zero in mathematics?',
    criminal: 'ArithmeticException'
  },
  {
    id: 'U3-02',
    title: 'The Wrong Catch',
    topic: 'EXCEPTIONS_THREADS',
    difficulty: 'Code Investigator',
    difficultyColor: 'amber',
    xpReward: 150,
    filename: 'Investigation.java',
    description: 'Catch block ordering error.',
    bannerSnippet: '} <span class="text-crimson">catch (Exception e)</span> {',
    code: [
        { text: '<span class="keyword">try</span> {', bug: false },
        { text: '    <span class="comment">// suspicious operation</span>', bug: false },
        { text: '}', bug: false },
        { text: '<span class="keyword">catch</span> (<span class="class-name">Exception</span> e) {', bug: true },
        { text: '}', bug: true },
        { text: '<span class="keyword">catch</span> (<span class="class-name">ArithmeticException</span> e) {', bug: true },
        { text: '}', bug: true }
      ],
    clues: [
        { text: 'There are multiple catch blocks for a single try block.', icon: '🔍' },
        { text: 'Exception is the parent class of all exceptions, including ArithmeticException.', icon: '🧬' },
        { text: 'Java catches exceptions from top to bottom.', icon: '⬇️' }
      ],
    suspects: [
        { name: 'Catch Ordering', icon: '🔀', correct: true },
        { name: 'ArithmeticException', icon: '➗', correct: false },
        { name: 'Missing Return', icon: '📤', correct: false },
        { name: 'Compilation Error', icon: '❌', correct: false }
      ],
    reasons: [
        { text: 'More specific exceptions must appear BEFORE broader (parent) exceptions', correct: true },
        { text: 'You can only have one catch block per try block', correct: false },
        { text: 'ArithmeticException is not a valid Java class', correct: false },
        { text: 'The try block is empty', correct: false }
      ],
    fixes: [
        { text: 'catch(ArithmeticException e){} catch(Exception e){}', correct: true },
        { text: 'catch(Exception e, ArithmeticException a){}', correct: false },
        { text: 'try{} catch(Exception e){} try{} catch(ArithmeticException e){}', correct: false },
        { text: 'catch(ArithmeticException e | Exception a){}', correct: false }
      ],
    detectorNote: 'Always cast a small net before you cast the big net. Put subclasses first!',
    criminal: 'Unreachable Catch Block'
  },
  {
    id: 'U3-03',
    title: 'The Nested Trap',
    topic: 'EXCEPTIONS_THREADS',
    difficulty: 'Code Investigator',
    difficultyColor: 'amber',
    xpReward: 150,
    filename: 'Lab.java',
    description: 'Determine which catch block handles a nested exception.',
    bannerSnippet: 'int[] a = {1}; <span class="text-crimson">a[5] = 10;</span>',
    code: [
        { text: '<span class="keyword">try</span> {', bug: false },
        { text: '    <span class="keyword">try</span> {', bug: false },
        { text: '        <span class="type">int</span>[] a = {<span class="number">1</span>};', bug: false },
        { text: '        a[<span class="number">5</span>] = <span class="number">10</span>;', bug: true },
        { text: '    } <span class="keyword">catch</span> (<span class="class-name">ArithmeticException</span> e) {', bug: false },
        { text: '        <span class="class-name">System</span>.<span class="variable">out</span>.<span class="method">println</span>(<span class="string">"Inner"</span>);', bug: false },
        { text: '    }', bug: false },
        { text: '} <span class="keyword">catch</span> (<span class="class-name">ArrayIndexOutOfBoundsException</span> e) {', bug: false },
        { text: '    <span class="class-name">System</span>.<span class="variable">out</span>.<span class="method">println</span>(<span class="string">"Outer"</span>);', bug: false },
        { text: '}', bug: false }
      ],
    clues: [
        { text: 'The error occurs at a[5] = 10.', icon: '🔍' },
        { text: 'The array only has one element (index 0). Accessing index 5 throws ArrayIndexOutOfBoundsException.', icon: '📊' },
        { text: 'The inner catch block only looks for ArithmeticException.', icon: '➗' }
      ],
    suspects: [
        { name: 'Inner Catch', icon: '📥', correct: false },
        { name: 'Outer Catch', icon: '📤', correct: true },
        { name: 'Uncaught Exception', icon: '❌', correct: false },
        { name: 'Compilation Error', icon: '🚫', correct: false }
      ],
    reasons: [
        { text: 'The inner block catches everything', correct: false },
        { text: 'The inner catch block doesn\\\'t match the exception, so the exception propagates to the outer catch block', correct: true },
        { text: 'Nested try-catch blocks are illegal in Java', correct: false },
        { text: 'ArrayIndexOutOfBoundsException is not an exception', correct: false }
      ],
    fixes: [
        { text: 'Output is: Outer', correct: true },
        { text: 'Output is: Inner', correct: false },
        { text: 'Program crashes', correct: false },
        { text: 'Compile Error', correct: false }
      ],
    detectorNote: 'If the inner trap doesn\\\'t fit the crime, the criminal escapes to the outer trap.',
    criminal: 'Nested Exception Propagation'
  },
  {
    id: 'U3-04',
    title: 'The Null Assassin',
    topic: 'EXCEPTIONS_THREADS',
    difficulty: 'Rookie',
    difficultyColor: 'green',
    xpReward: 100,
    filename: 'Witness.java',
    description: 'Built-in Exceptions: Using a null reference.',
    bannerSnippet: '<span class="text-crimson">witness.length()</span>;',
    code: [
        { text: '<span class="type">String</span> witness = <span class="keyword">null</span>;', bug: false },
        { text: '', bug: false },
        { text: '<span class="class-name">System</span>.<span class="variable">out</span>.<span class="method">println</span>(witness.<span class="method">length</span>());', bug: true }
      ],
    clues: [
        { text: 'The \'witness\' string is explicitly set to null.', icon: '🔍' },
        { text: 'Null means \'no object exists\'.', icon: '🕳️' },
        { text: 'The code tries to call the length() method on an object that doesn\'t exist.', icon: '💀' }
      ],
    suspects: [
        { name: 'StringIndexOutOfBoundsException', icon: '📊', correct: false },
        { name: 'NullPointerException', icon: '💀', correct: true },
        { name: 'ArithmeticException', icon: '➗', correct: false },
        { name: 'TypeMismatch', icon: '🎭', correct: false }
      ],
    reasons: [
        { text: 'You cannot call methods on a null reference', correct: true },
        { text: 'Strings do not have a length() method', correct: false },
        { text: 'Length returns 0 for null strings', correct: false },
        { text: 'Null is not a valid Java keyword', correct: false }
      ],
    fixes: [
        { text: 'if (witness != null) { System.out.println(witness.length()); }', correct: true },
        { text: 'System.out.println(witness);', correct: false },
        { text: 'System.out.println(witness[0]);', correct: false },
        { text: 'System.out.println(null);', correct: false }
      ],
    detectorNote: 'Always verify your witness exists before interrogating them!',
    criminal: 'NullPointerException'
  },
  {
    id: 'U3-05',
    title: 'The Unauthorized Age',
    topic: 'EXCEPTIONS_THREADS',
    difficulty: 'Senior Investigator',
    difficultyColor: 'crimson',
    xpReward: 200,
    filename: 'Auth.java',
    description: 'User-Defined Exception.',
    bannerSnippet: '<span class="text-crimson">throw new InvalidAgeException("Too young");</span>',
    code: [
        { text: '<span class="keyword">class</span> <span class="class-name">InvalidAgeException</span> <span class="keyword">extends</span> <span class="class-name">Exception</span> {', bug: false },
        { text: '    <span class="keyword">public</span> <span class="class-name">InvalidAgeException</span>(<span class="type">String</span> msg) { <span class="keyword">super</span>(msg); }', bug: false },
        { text: '}', bug: false },
        { text: '', bug: false },
        { text: '<span class="keyword">void</span> <span class="method">checkAge</span>(<span class="type">int</span> age) {', bug: true },
        { text: '    <span class="keyword">if</span> (age < <span class="number">18</span>) {', bug: false },
        { text: '        <span class="keyword">throw new</span> <span class="class-name">InvalidAgeException</span>(<span class="string">"Too young"</span>);', bug: true },
        { text: '    }', bug: false },
        { text: '}', bug: false }
      ],
    clues: [
        { text: 'InvalidAgeException extends Exception, meaning it is a Checked Exception.', icon: '🔍' },
        { text: 'The method checkAge throws this checked exception.', icon: '📤' },
        { text: 'Methods that throw checked exceptions must declare them in their signature using \'throws\'.', icon: '📜' }
      ],
    suspects: [
        { name: 'Missing \'throws\' declaration', icon: '📜', correct: true },
        { name: 'Invalid throw syntax', icon: '❌', correct: false },
        { name: 'Missing inheritance', icon: '🧬', correct: false },
        { name: 'Exception subclassing error', icon: '🚫', correct: false }
      ],
    reasons: [
        { text: 'Custom exceptions must extend RuntimeException to avoid throws', correct: false },
        { text: 'Checked exceptions must be explicitly declared in the method signature', correct: true },
        { text: 'You cannot throw exceptions from inside an if-statement', correct: false },
        { text: 'InvalidAgeException does not exist', correct: false }
      ],
    fixes: [
        { text: 'void checkAge(int age) throws InvalidAgeException { ... }', correct: true },
        { text: 'void checkAge(int age) catch InvalidAgeException { ... }', correct: false },
        { text: 'void checkAge(int age) throw Exception { ... }', correct: false },
        { text: 'void checkAge(int age) { ... }', correct: false }
      ],
    detectorNote: 'If you throw a checked bomb, you must put a warning sign (throws) on the door!',
    criminal: 'Undeclared Checked Exception'
  },
  {
    id: 'U3-06',
    title: 'The Missing Thread',
    topic: 'EXCEPTIONS_THREADS',
    difficulty: 'Code Investigator',
    difficultyColor: 'amber',
    xpReward: 150,
    filename: 'Investigation.java',
    description: 'Thread creation and start.',
    bannerSnippet: 'Investigation i = new Investigation(); <span class="text-crimson">i.run();</span>',
    code: [
        { text: '<span class="keyword">class</span> <span class="class-name">Investigation</span> <span class="keyword">extends</span> <span class="class-name">Thread</span> {', bug: false },
        { text: '    <span class="keyword">public void</span> <span class="method">run</span>() {', bug: false },
        { text: '        <span class="class-name">System</span>.<span class="variable">out</span>.<span class="method">println</span>(<span class="string">"Investigating"</span>);', bug: false },
        { text: '    }', bug: false },
        { text: '}', bug: false },
        { text: '', bug: false },
        { text: '<span class="class-name">Investigation</span> i = <span class="keyword">new</span> <span class="class-name">Investigation</span>();', bug: false },
        { text: 'i.<span class="method">run</span>();', bug: true }
      ],
    clues: [
        { text: 'The class extends Thread, which is correct for creating a thread.', icon: '🔍' },
        { text: 'Calling run() directly just executes the method in the CURRENT thread like a normal method call.', icon: '📞' },
        { text: 'To actually spawn a NEW thread, a different method must be called.', icon: '🌟' }
      ],
    suspects: [
        { name: 'Thread not started correctly', icon: '🌟', correct: true },
        { name: 'Missing inheritance', icon: '🧬', correct: false },
        { name: 'Compilation Error', icon: '❌', correct: false },
        { name: 'NullPointerException', icon: '💀', correct: false }
      ],
    reasons: [
        { text: 'You must implement Runnable instead of extending Thread', correct: false },
        { text: 'Calling run() does not spawn a new thread; you must call start()', correct: true },
        { text: 'The thread object \'i\' is null', correct: false },
        { text: 'The run() method must be static', correct: false }
      ],
    fixes: [
        { text: 'i.start();', correct: true },
        { text: 'i.execute();', correct: false },
        { text: 'i.begin();', correct: false },
        { text: 'i.spawn();', correct: false }
      ],
    detectorNote: 'Running is just running. Starting is what tells Java to spin up a whole new timeline (thread)!',
    criminal: 'Incorrect Thread Invocation'
  },
  {
    id: 'U3-07',
    title: 'The Race Condition Heist',
    topic: 'EXCEPTIONS_THREADS',
    difficulty: 'Senior Investigator',
    difficultyColor: 'crimson',
    xpReward: 250,
    filename: 'Bank.java',
    description: 'Multiple threads modifying shared state.',
    bannerSnippet: '<span class="text-crimson">balance++;</span> // Accessed by 10 threads',
    code: [
        { text: '<span class="keyword">class</span> <span class="class-name">Bank</span> {', bug: false },
        { text: '    <span class="keyword">int</span> balance = <span class="number">0</span>;', bug: false },
        { text: '', bug: false },
        { text: '    <span class="keyword">void</span> <span class="method">deposit</span>() {', bug: false },
        { text: '        balance++;', bug: true },
        { text: '    }', bug: false },
        { text: '}', bug: false },
        { text: '<span class="comment">// Assume 10 threads call deposit() 100 times each simultaneously.</span>', bug: false },
        { text: '<span class="comment">// Expected total: 1000. Actual total: 942.</span>', bug: true }
      ],
    clues: [
        { text: 'The expected total is 1000, but the actual total is unpredictable (like 942).', icon: '🔍' },
        { text: 'balance++ is not a single atomic operation; it is a read, increment, and write.', icon: '⏱️' },
        { text: 'Multiple threads are reading the same old balance simultaneously and writing back identical incremented values.', icon: '👥' }
      ],
    suspects: [
        { name: 'Race Condition', icon: '🏃', correct: true },
        { name: 'ArithmeticException', icon: '➗', correct: false },
        { name: 'Variable shadowing', icon: '👥', correct: false },
        { name: 'NullPointerException', icon: '💀', correct: false }
      ],
    reasons: [
        { text: 'Multiple threads are overwriting each other\'s updates because the operation is not synchronized', correct: true },
        { text: 'The loop condition is incorrect', correct: false },
        { text: 'The balance variable cannot exceed 942', correct: false },
        { text: 'Java randomly drops thread operations', correct: false }
      ],
    fixes: [
        { text: 'The criminal is a Race Condition. Synchronization is needed.', correct: true },
        { text: 'The criminal is a syntax error.', correct: false },
        { text: 'The criminal is a math error.', correct: false },
        { text: 'The criminal is a loop error.', correct: false }
      ],
    detectorNote: 'If two detectives try to file paperwork in the exact same folder at the same millisecond, one file gets lost!',
    criminal: 'Race Condition'
  },
  {
    id: 'U3-08',
    title: 'The Locked Evidence Room',
    topic: 'EXCEPTIONS_THREADS',
    difficulty: 'Senior Investigator',
    difficultyColor: 'crimson',
    xpReward: 250,
    filename: 'Bank.java',
    description: 'Synchronization solution to a race condition.',
    bannerSnippet: '<span class="text-crimson">void deposit()</span> { balance++; }',
    code: [
        { text: '<span class="keyword">class</span> <span class="class-name">Bank</span> {', bug: false },
        { text: '    <span class="keyword">int</span> balance = <span class="number">0</span>;', bug: false },
        { text: '', bug: false },
        { text: '    <span class="keyword">void</span> <span class="method">deposit</span>() {', bug: true },
        { text: '        balance++;', bug: false },
        { text: '    }', bug: false },
        { text: '}', bug: false }
      ],
    clues: [
        { text: 'This is the same crime scene from The Race Condition Heist.', icon: '🔍' },
        { text: 'We need to ensure only ONE thread can execute the deposit() method at a time.', icon: '🔒' },
        { text: 'Java provides a specific keyword to lock a method to a single thread.', icon: '🔑' }
      ],
    suspects: [
        { name: 'Missing Synchronization', icon: '🔒', correct: true },
        { name: 'Missing Volatile', icon: '⚡', correct: false },
        { name: 'TypeMismatch', icon: '🎭', correct: false },
        { name: 'Missing Thread.sleep()', icon: '💤', correct: false }
      ],
    reasons: [
        { text: 'The method must be marked synchronized so only one thread can acquire the lock', correct: true },
        { text: 'The variable balance must be declared final', correct: false },
        { text: 'The thread needs to sleep before incrementing', correct: false },
        { text: 'The method must be static', correct: false }
      ],
    fixes: [
        { text: 'synchronized void deposit() { balance++; }', correct: true },
        { text: 'void deposit(synchronized) { balance++; }', correct: false },
        { text: 'volatile void deposit() { balance++; }', correct: false },
        { text: 'static void deposit() { balance++; }', correct: false }
      ],
    detectorNote: 'Synchronized is the lock on the evidence room door. Only one detective inside at a time!',
    criminal: 'Missing Synchronization'
  },
  {
    id: 'U3-09',
    title: 'The Waiting Witness',
    topic: 'EXCEPTIONS_THREADS',
    difficulty: 'Master Detective',
    difficultyColor: 'crimson',
    xpReward: 300,
    filename: 'Interrogation.java',
    description: 'Inter-thread communication using wait() and notify().',
    bannerSnippet: 'Thread 1: <span class="text-cyan">wait();</span> Thread 2: <span class="text-crimson">_______;</span>',
    code: [
        { text: '<span class="keyword">class</span> <span class="class-name">Room</span> {', bug: false },
        { text: '    <span class="keyword">synchronized void</span> <span class="method">waitForAnswer</span>() <span class="keyword">throws</span> <span class="class-name">InterruptedException</span> {', bug: false },
        { text: '        <span class="method">wait</span>();', bug: false },
        { text: '    }', bug: false },
        { text: '', bug: false },
        { text: '    <span class="keyword">synchronized void</span> <span class="method">provideAnswer</span>() {', bug: false },
        { text: '        <span class="keyword">________</span>;', bug: true },
        { text: '    }', bug: false },
        { text: '}', bug: false }
      ],
    clues: [
        { text: 'Thread 1 enters waitForAnswer() and calls wait(). It goes to sleep.', icon: '💤' },
        { text: 'Thread 2 enters provideAnswer() when it has the information.', icon: '📝' },
        { text: 'Thread 2 needs a way to wake up Thread 1.', icon: '🔔' }
      ],
    suspects: [
        { name: 'Missing notify()', icon: '🔔', correct: true },
        { name: 'Missing start()', icon: '🌟', correct: false },
        { name: 'Missing wake()', icon: '⏰', correct: false },
        { name: 'Missing resume()', icon: '▶️', correct: false }
      ],
    reasons: [
        { text: 'The wait() method pauses a thread until another thread calls notify() or notifyAll() on the same object', correct: true },
        { text: 'The thread needs to be restarted with start()', correct: false },
        { text: 'The wake() method wakes up sleeping threads', correct: false },
        { text: 'Thread.resume() is the correct safe method', correct: false }
      ],
    fixes: [
        { text: 'notify();', correct: true },
        { text: 'wake();', correct: false },
        { text: 'start();', correct: false },
        { text: 'resume();', correct: false }
      ],
    detectorNote: 'In Java, threads wait() to sleep, and notify() to ring the alarm for others.',
    criminal: 'Thread Deadlock / Sleeping'
  },
  {
    id: 'U3-10',
    title: 'The Boxed Identity',
    topic: 'EXCEPTIONS_THREADS',
    difficulty: 'Code Investigator',
    difficultyColor: 'amber',
    xpReward: 150,
    filename: 'Evidence.java',
    description: 'Wrappers and Autoboxing.',
    bannerSnippet: '<span class="text-cyan">Integer evidence = 100;</span>',
    code: [
        { text: '<span class="class-name">Integer</span> evidence = <span class="number">100</span>;', bug: false },
        { text: '<span class="type">int</span> result = evidence;', bug: false }
      ],
    clues: [
        { text: '\'Integer\' is an object wrapper class. \'int\' is a primitive type.', icon: '🔍' },
        { text: 'We are assigning a primitive (100) directly to an Object (evidence).', icon: '📦' },
        { text: 'We are assigning an Object (evidence) directly to a primitive (result).', icon: '📤' }
      ],
    suspects: [
        { name: 'Autoboxing and Unboxing', icon: '📦', correct: true },
        { name: 'Compilation Error', icon: '❌', correct: false },
        { name: 'ClassCastException', icon: '🎭', correct: false },
        { name: 'TypeMismatch', icon: '🚫', correct: false }
      ],
    reasons: [
        { text: 'Java automatically converts between primitives and their wrapper classes', correct: true },
        { text: 'You cannot mix objects and primitives without explicit casts', correct: false },
        { text: 'The Integer class does not support assignment from ints', correct: false },
        { text: 'Variables must be the exact same type', correct: false }
      ],
    fixes: [
        { text: 'The code is correct. It uses Autoboxing and Unboxing.', correct: true },
        { text: 'Integer evidence = new Integer(100);', correct: false },
        { text: 'int result = (int) evidence;', correct: false },
        { text: 'Compile Error.', correct: false }
      ],
    detectorNote: 'Java is smart. It "boxes" a primitive into an Object when needed, and "unboxes" it back automatically.',
    criminal: 'Autoboxing Concept'
  },
  {
    id: 'U4-01',
    title: 'The Silent Console',
    topic: 'IO_GENERICS',
    difficulty: 'Rookie',
    difficultyColor: 'green',
    xpReward: 100,
    filename: 'Investigation.java',
    description: 'Console I/O and Type Mismatch.',
    bannerSnippet: 'Scanner sc = new Scanner(System.in); <span class="text-crimson">int age = sc.nextLine();</span>',
    code: [
        { text: '<span class="keyword">import</span> java.util.Scanner;', bug: false },
        { text: '', bug: false },
        { text: '<span class="class-name">Scanner</span> sc = <span class="keyword">new</span> <span class="class-name">Scanner</span>(<span class="class-name">System</span>.<span class="variable">in</span>);', bug: false },
        { text: '<span class="class-name">System</span>.<span class="variable">out</span>.<span class="method">print</span>(<span class="string">"Enter your age: "</span>);', bug: false },
        { text: '<span class="type">int</span> age = sc.<span class="method">nextLine</span>();', bug: true }
      ],
    clues: [
        { text: 'The program asks the user for their age, expecting a number.', icon: '🔍' },
        { text: 'The variable \'age\' is declared as an \'int\'.', icon: '🔢' },
        { text: 'The Scanner\'s \'nextLine()\' method returns a String, not an int.', icon: '🔤' }
      ],
    suspects: [
        { name: 'NullPointerException', icon: '💀', correct: false },
        { name: 'TypeMismatch', icon: '🎭', correct: true },
        { name: 'InputMismatchException', icon: '❌', correct: false },
        { name: 'Missing Scanner', icon: '📠', correct: false }
      ],
    reasons: [
        { text: 'A String cannot be assigned to an int variable without conversion', correct: true },
        { text: 'The Scanner must be closed', correct: false },
        { text: 'nextLine() reads integers by default', correct: false },
        { text: 'System.out.print cannot be used for input', correct: false }
      ],
    fixes: [
        { text: 'int age = sc.nextInt();', correct: true },
        { text: 'int age = (int) sc.nextLine();', correct: false },
        { text: 'int age = sc.next();', correct: false },
        { text: 'String age = sc.nextInt();', correct: false }
      ],
    detectorNote: 'If you want a number, use nextInt(). If you want text, use nextLine().',
    criminal: 'TypeMismatch'
  },
  {
    id: 'U4-02',
    title: 'The Missing File',
    topic: 'IO_GENERICS',
    difficulty: 'Code Investigator',
    difficultyColor: 'amber',
    xpReward: 150,
    filename: 'FileHandler.java',
    description: 'File I/O and Checked Exceptions.',
    bannerSnippet: 'FileReader reader = <span class="text-crimson">new FileReader("evidence.txt")</span>;',
    code: [
        { text: '<span class="keyword">import</span> java.io.FileReader;', bug: false },
        { text: '', bug: false },
        { text: '<span class="keyword">void</span> <span class="method">readEvidence</span>() {', bug: false },
        { text: '    <span class="class-name">FileReader</span> reader = <span class="keyword">new</span> <span class="class-name">FileReader</span>(<span class="string">"evidence.txt"</span>);', bug: true },
        { text: '}', bug: false }
      ],
    clues: [
        { text: 'The program tries to open a file named \'evidence.txt\'.', icon: '🔍' },
        { text: 'Opening a file might fail if the file doesn\'t exist on the hard drive.', icon: '📂' },
        { text: 'Java forces you to handle this possibility with a checked exception.', icon: '⚠️' }
      ],
    suspects: [
        { name: 'FileNotFoundException', icon: '📄', correct: true },
        { name: 'NullPointerException', icon: '💀', correct: false },
        { name: 'Variable shadowing', icon: '👥', correct: false },
        { name: 'ClassCastException', icon: '🎭', correct: false }
      ],
    reasons: [
        { text: 'FileReader throws a checked FileNotFoundException which must be caught or declared', correct: true },
        { text: 'The filename must use double backslashes', correct: false },
        { text: 'FileReader cannot read text files', correct: false },
        { text: 'The file is locked by another process', correct: false }
      ],
    fixes: [
        { text: 'try { FileReader reader = new FileReader("evidence.txt"); } catch (FileNotFoundException e) {}', correct: true },
        { text: 'FileReader reader = new FileReader();', correct: false },
        { text: 'File f = new FileReader("evidence.txt");', correct: false },
        { text: 'FileReader reader = "evidence.txt";', correct: false }
      ],
    detectorNote: 'Always plan for the worst when dealing with the filesystem!',
    criminal: 'Unhandled Checked Exception'
  },
  {
    id: 'U4-03',
    title: 'The Vanishing Evidence',
    topic: 'IO_GENERICS',
    difficulty: 'Code Investigator',
    difficultyColor: 'amber',
    xpReward: 150,
    filename: 'FileHandler.java',
    description: 'Resource Handling and Memory Leaks.',
    bannerSnippet: 'reader.read(); <span class="text-crimson">// Done reading</span>',
    code: [
        { text: '<span class="keyword">try</span> {', bug: false },
        { text: '    <span class="class-name">FileReader</span> reader = <span class="keyword">new</span> <span class="class-name">FileReader</span>(<span class="string">"evidence.txt"</span>);', bug: false },
        { text: '    <span class="type">int</span> data = reader.<span class="method">read</span>();', bug: false },
        { text: '} <span class="keyword">catch</span> (<span class="class-name">Exception</span> e) {', bug: false },
        { text: '    e.<span class="method">printStackTrace</span>();', bug: false },
        { text: '}', bug: true }
      ],
    clues: [
        { text: 'The code opens a file and reads data from it.', icon: '🔍' },
        { text: 'Files are operating system resources.', icon: '💾' },
        { text: 'The code finishes without closing the resource, which can cause memory leaks or file locks.', icon: '🔓' }
      ],
    suspects: [
        { name: 'Resource Leak', icon: '🔓', correct: true },
        { name: 'NullPointerException', icon: '💀', correct: false },
        { name: 'FileNotFoundException', icon: '📄', correct: false },
        { name: 'Syntax Error', icon: '❌', correct: false }
      ],
    reasons: [
        { text: 'The reader is never closed, keeping the file locked', correct: true },
        { text: 'The try block is empty', correct: false },
        { text: 'Exception is too broad of a catch', correct: false },
        { text: 'read() returns a char, not an int', correct: false }
      ],
    fixes: [
        { text: 'Use a finally block with reader.close(), or use Try-With-Resources: try (FileReader r = new FileReader("evidence.txt")) { ... }', correct: true },
        { text: 'reader.delete();', correct: false },
        { text: 'reader = null;', correct: false },
        { text: 'catch (ResourceLeak e)', correct: false }
      ],
    detectorNote: 'If you open a door, close it. Try-with-resources does it automatically!',
    criminal: 'Resource Leak'
  },
  {
    id: 'U4-04',
    title: 'The Unsafe Container',
    topic: 'IO_GENERICS',
    difficulty: 'Rookie',
    difficultyColor: 'green',
    xpReward: 100,
    filename: 'Lab.java',
    description: 'The need for Generics for type safety.',
    bannerSnippet: 'evidence.add("Fingerprint"); <span class="text-crimson">evidence.add(100);</span>',
    code: [
        { text: '<span class="class-name">ArrayList</span> evidence = <span class="keyword">new</span> <span class="class-name">ArrayList</span>();', bug: true },
        { text: '', bug: false },
        { text: 'evidence.<span class="method">add</span>(<span class="string">"Fingerprint"</span>);', bug: false },
        { text: 'evidence.<span class="method">add</span>(<span class="number">100</span>);', bug: false }
      ],
    clues: [
        { text: 'The ArrayList is created without specifying a type (it is a Raw Type).', icon: '🔍' },
        { text: 'Raw types allow you to mix Strings, Integers, and any other object together.', icon: '📦' },
        { text: 'This usually leads to ClassCastExceptions later when you retrieve the data.', icon: '⚠️' }
      ],
    suspects: [
        { name: 'Raw Type Vulnerability', icon: '📦', correct: true },
        { name: 'TypeMismatch', icon: '🎭', correct: false },
        { name: 'NullPointerException', icon: '💀', correct: false },
        { name: 'IndexOutOfBounds', icon: '📊', correct: false }
      ],
    reasons: [
        { text: 'Collections without generics are not type-safe and accept any Object', correct: true },
        { text: 'ArrayLists can only store Strings', correct: false },
        { text: '100 is a primitive and cannot be added to a collection', correct: false },
        { text: 'The array is out of bounds', correct: false }
      ],
    fixes: [
        { text: 'ArrayList<String> evidence = new ArrayList<>();', correct: true },
        { text: 'ArrayList(String) evidence = new ArrayList();', correct: false },
        { text: 'String[] evidence = new ArrayList();', correct: false },
        { text: 'ArrayList evidence = new ArrayList(String);', correct: false }
      ],
    detectorNote: 'Generics (<String>) enforce rules so you don\'t accidentally put a gun in a bag meant for donuts.',
    criminal: 'Raw Type Safety Violation'
  },
  {
    id: 'U4-05',
    title: 'The Universal Evidence Box',
    topic: 'IO_GENERICS',
    difficulty: 'Code Investigator',
    difficultyColor: 'amber',
    xpReward: 150,
    filename: 'EvidenceBox.java',
    description: 'Constructing Generic Classes.',
    bannerSnippet: 'class EvidenceBox<span class="text-crimson">&lt;____&gt;</span> {',
    code: [
        { text: '<span class="keyword">class</span> <span class="class-name">EvidenceBox</span>&lt;<span class="keyword">____</span>&gt; {', bug: true },
        { text: '', bug: false },
        { text: '    <span class="keyword">private</span> <span class="keyword">____</span> evidence;', bug: true },
        { text: '', bug: false },
        { text: '    <span class="keyword">void</span> <span class="method">store</span>(<span class="keyword">____</span> evidence) {', bug: true },
        { text: '        <span class="keyword">this</span>.evidence = evidence;', bug: false },
        { text: '    }', bug: false },
        { text: '}', bug: false }
      ],
    clues: [
        { text: 'This class is meant to hold ANY type of evidence.', icon: '🔍' },
        { text: 'Java allows you to use Type Parameters (usually a single uppercase letter).', icon: '🔠' },
        { text: 'The letter acts as a placeholder for the actual type that will be used later.', icon: '📦' }
      ],
    suspects: [
        { name: 'Generic Type Parameter', icon: '🔠', correct: true },
        { name: 'Raw Type', icon: '📦', correct: false },
        { name: 'Missing Return', icon: '📤', correct: false },
        { name: 'Missing inheritance', icon: '🧬', correct: false }
      ],
    reasons: [
        { text: 'A type parameter like T allows the class to be strongly typed when instantiated', correct: true },
        { text: 'Classes cannot be generic', correct: false },
        { text: 'The blanks should be filled with \'Object\'', correct: false },
        { text: 'The blanks should be filled with \'String\'', correct: false }
      ],
    fixes: [
        { text: 'class EvidenceBox<T> { private T evidence; void store(T evidence) { ... } }', correct: true },
        { text: 'class EvidenceBox<Object> { private Object evidence; }', correct: false },
        { text: 'class EvidenceBox<String> { private String evidence; }', correct: false },
        { text: 'class EvidenceBox<Generic> { private Generic evidence; }', correct: false }
      ],
    detectorNote: 'Use <T> for Type. It\'s a placeholder that morphs into whatever type you need later!',
    criminal: 'Missing Generic Declaration'
  },
  {
    id: 'U4-06',
    title: 'The Generic Investigator',
    topic: 'IO_GENERICS',
    difficulty: 'Senior Investigator',
    difficultyColor: 'crimson',
    xpReward: 250,
    filename: 'Lab.java',
    description: 'Generic Methods.',
    bannerSnippet: 'static <span class="text-crimson">&lt;T&gt;</span> void inspect(T evidence)',
    code: [
        { text: '<span class="keyword">static</span> &lt;<span class="class-name">T</span>&gt; <span class="keyword">void</span> <span class="method">inspect</span>(<span class="class-name">T</span> evidence) {', bug: false },
        { text: '    <span class="class-name">System</span>.<span class="variable">out</span>.<span class="method">println</span>(evidence);', bug: false },
        { text: '}', bug: false },
        { text: '', bug: false },
        { text: '<span class="comment">// Will this code compile?</span>', bug: false },
        { text: '<span class="method">inspect</span>(<span class="string">"Blood"</span>);', bug: false },
        { text: '<span class="method">inspect</span>(<span class="number">145</span>);', bug: false },
        { text: '<span class="method">inspect</span>(<span class="number">99.9</span>);', bug: false }
      ],
    clues: [
        { text: 'The method is a Generic Method, denoted by the <T> before the return type.', icon: '🔍' },
        { text: 'It accepts a parameter of type T.', icon: '📥' },
        { text: 'We are passing a String, an Integer, and a Double to the same method.', icon: '🎭' }
      ],
    suspects: [
        { name: 'Compilation Error', icon: '❌', correct: false },
        { name: 'TypeMismatch', icon: '🚫', correct: false },
        { name: 'Valid Generic Execution', icon: '✅', correct: true },
        { name: 'NullPointerException', icon: '💀', correct: false }
      ],
    reasons: [
        { text: 'A generic method accepts any Object type, and autoboxing handles the primitives', correct: true },
        { text: 'T defaults to String, so passing 145 fails', correct: false },
        { text: 'Generic methods cannot be static', correct: false },
        { text: 'You must explicitly specify the type like inspect<String>("Blood")', correct: false }
      ],
    fixes: [
        { text: 'The code is completely valid and compiles.', correct: true },
        { text: 'Change T to Object', correct: false },
        { text: 'Create three overloaded inspect() methods', correct: false },
        { text: 'Compile Error.', correct: false }
      ],
    detectorNote: 'One method to rule them all! Generics allow you to write a method once and use it for any object type.',
    criminal: 'Valid Generic Method'
  },
  {
    id: 'U4-07',
    title: 'The Restricted Type',
    topic: 'IO_GENERICS',
    difficulty: 'Senior Investigator',
    difficultyColor: 'crimson',
    xpReward: 250,
    filename: 'Vault.java',
    description: 'Bounded Type Parameters.',
    bannerSnippet: 'class EvidenceBox<span class="text-crimson">&lt;T extends Number&gt;</span>',
    code: [
        { text: '<span class="keyword">class</span> <span class="class-name">EvidenceBox</span>&lt;<span class="class-name">T</span> <span class="keyword">extends</span> <span class="class-name">Number</span>&gt; {', bug: false },
        { text: '    <span class="class-name">T</span> value;', bug: false },
        { text: '}', bug: false },
        { text: '', bug: false },
        { text: '<span class="class-name">EvidenceBox</span>&lt;<span class="class-name">Integer</span>&gt; box1 = <span class="keyword">new</span> <span class="class-name">EvidenceBox</span>&lt;&gt;();', bug: false },
        { text: '<span class="class-name">EvidenceBox</span>&lt;<span class="class-name">Double</span>&gt; box2 = <span class="keyword">new</span> <span class="class-name">EvidenceBox</span>&lt;&gt;();', bug: false },
        { text: '<span class="class-name">EvidenceBox</span>&lt;<span class="class-name">String</span>&gt; box3 = <span class="keyword">new</span> <span class="class-name">EvidenceBox</span>&lt;&gt;();', bug: true }
      ],
    clues: [
        { text: 'The class EvidenceBox uses a Bounded Type Parameter (<T extends Number>).', icon: '🔍' },
        { text: 'This means T can only be Number or a subclass of Number.', icon: '🔢' },
        { text: 'Integer and Double are subclasses of Number. String is not.', icon: '🚫' }
      ],
    suspects: [
        { name: 'Compilation Error', icon: '❌', correct: true },
        { name: 'TypeMismatch', icon: '🎭', correct: false },
        { name: 'Valid Generic Execution', icon: '✅', correct: false },
        { name: 'NullPointerException', icon: '💀', correct: false }
      ],
    reasons: [
        { text: 'String does not extend Number, violating the type bound', correct: true },
        { text: 'EvidenceBox cannot be instantiated multiple times', correct: false },
        { text: 'Double is not a subclass of Number', correct: false },
        { text: 'Integer cannot be boxed', correct: false }
      ],
    fixes: [
        { text: 'String cannot be used. Remove box3, or change the bound.', correct: true },
        { text: 'EvidenceBox<String extends Number> box3;', correct: false },
        { text: 'EvidenceBox<Number> box3 = new EvidenceBox<String>();', correct: false },
        { text: 'Cast String to Number', correct: false }
      ],
    detectorNote: 'Bounds set the rules. \'extends Number\' means \'Numbers only allowed inside!\'',
    criminal: 'Type Bound Violation'
  },
  {
    id: 'U4-08',
    title: 'The Forbidden Generic',
    topic: 'IO_GENERICS',
    difficulty: 'Master Detective',
    difficultyColor: 'crimson',
    xpReward: 350,
    filename: 'Lab.java',
    description: 'Generic instantiation restrictions (Type Erasure).',
    bannerSnippet: 'T evidence = <span class="text-crimson">new T()</span>;',
    code: [
        { text: '<span class="keyword">class</span> <span class="class-name">EvidenceBox</span>&lt;<span class="class-name">T</span>&gt; {', bug: false },
        { text: '    <span class="class-name">T</span> evidence;', bug: false },
        { text: '', bug: false },
        { text: '    <span class="keyword">void</span> <span class="method">createEvidence</span>() {', bug: false },
        { text: '        evidence = <span class="keyword">new</span> <span class="class-name">T</span>();', bug: true },
        { text: '    }', bug: false },
        { text: '}', bug: false }
      ],
    clues: [
        { text: 'The code tries to instantiate the generic type parameter T.', icon: '🔍' },
        { text: 'Due to Type Erasure, the compiler does not know what T will be at runtime.', icon: '👻' },
        { text: 'You cannot instantiate an unknown type.', icon: '🚫' }
      ],
    suspects: [
        { name: 'Forbidden Generic Instantiation', icon: '❌', correct: true },
        { name: 'Raw Type', icon: '📦', correct: false },
        { name: 'NullPointerException', icon: '💀', correct: false },
        { name: 'Constructor mismatch', icon: '🏗️', correct: false }
      ],
    reasons: [
        { text: 'Because of Type Erasure, \'new T()\' is illegal in Java', correct: true },
        { text: 'T does not have a default constructor', correct: false },
        { text: 'The variable evidence must be static', correct: false },
        { text: 'evidence is already initialized', correct: false }
      ],
    fixes: [
        { text: 'Pass a factory or Class<T> into the method to create instances', correct: true },
        { text: 'evidence = new Object();', correct: false },
        { text: 'evidence = T.new();', correct: false },
        { text: 'evidence = new T[];', correct: false }
      ],
    detectorNote: 'Because of Type Erasure, generics are ghosts at runtime. You can\'t construct a ghost!',
    criminal: 'Generic Erasure Rule Violation'
  },
  {
    id: 'U4-09',
    title: 'The Immutable Message',
    topic: 'IO_GENERICS',
    difficulty: 'Code Investigator',
    difficultyColor: 'amber',
    xpReward: 150,
    filename: 'Letter.java',
    description: 'Understanding String Immutability.',
    bannerSnippet: 'message.<span class="text-crimson">concat(" Detective")</span>;',
    code: [
        { text: '<span class="type">String</span> message = <span class="string">"Java"</span>;', bug: false },
        { text: 'message.<span class="method">concat</span>(<span class="string">" Detective"</span>);', bug: true },
        { text: '<span class="class-name">System</span>.<span class="variable">out</span>.<span class="method">println</span>(message);', bug: false }
      ],
    clues: [
        { text: 'The concat() method joins two strings together.', icon: '🔍' },
        { text: 'Strings in Java are Immutable, meaning they can never be changed after creation.', icon: '🔒' },
        { text: 'concat() creates a BRAND NEW string and returns it, but doesn\'t change the original.', icon: '✨' }
      ],
    suspects: [
        { name: '"Java"', icon: '☕', correct: true },
        { name: '"Java Detective"', icon: '🕵️', correct: false },
        { name: 'Compilation Error', icon: '❌', correct: false },
        { name: 'NullPointerException', icon: '💀', correct: false }
      ],
    reasons: [
        { text: 'Strings are immutable. The new concatenated string was created but immediately discarded', correct: true },
        { text: 'The concat method modifies the original string', correct: false },
        { text: 'Strings cannot contain spaces', correct: false },
        { text: 'The concat method is deprecated', correct: false }
      ],
    fixes: [
        { text: 'message = message.concat(" Detective");', correct: true },
        { text: 'message.append(" Detective");', correct: false },
        { text: 'String message2 = " Detective";', correct: false },
        { text: 'System.out.println(message);', correct: false }
      ],
    detectorNote: 'Strings are set in stone. If you want to change one, you actually have to carve a brand new stone and assign it!',
    criminal: 'String Immutability'
  },
  {
    id: 'U4-10',
    title: 'The StringBuffer Operation',
    topic: 'IO_GENERICS',
    difficulty: 'Rookie',
    difficultyColor: 'green',
    xpReward: 100,
    filename: 'Report.java',
    description: 'Using mutable String structures.',
    bannerSnippet: '<span class="text-cyan">sb.append("Detective")</span>;',
    code: [
        { text: '<span class="class-name">StringBuffer</span> sb = <span class="keyword">new</span> <span class="class-name">StringBuffer</span>(<span class="string">"Java "</span>);', bug: false },
        { text: 'sb.<span class="method">append</span>(<span class="string">"Detective"</span>);', bug: false },
        { text: 'sb.<span class="method">reverse</span>();', bug: false },
        { text: '<span class="class-name">System</span>.<span class="variable">out</span>.<span class="method">println</span>(sb);', bug: false }
      ],
    clues: [
        { text: 'StringBuffer is MUTABLE, unlike String.', icon: '🔍' },
        { text: 'append() adds text to the end, resulting in \'Java Detective\'.', icon: '📝' },
        { text: 'reverse() flips the entire string backward.', icon: '🔄' }
      ],
    suspects: [
        { name: 'evitceteD avaJ', icon: '🔄', correct: true },
        { name: 'Java Detective', icon: '🕵️', correct: false },
        { name: 'Compilation Error', icon: '❌', correct: false },
        { name: 'Java evitceteD', icon: '🧩', correct: false }
      ],
    reasons: [
        { text: 'StringBuffer is modified in-place. It first appends, then the whole string is reversed.', correct: true },
        { text: 'StringBuffer is immutable like String', correct: false },
        { text: 'append() doesn\'t modify the original object', correct: false },
        { text: 'reverse() only reverses the last appended word', correct: false }
      ],
    fixes: [
        { text: 'The code is fully functional.', correct: true },
        { text: 'sb = sb.append("Detective");', correct: false },
        { text: 'sb.reverse("Detective");', correct: false },
        { text: 'String sb = new String();', correct: false }
      ],
    detectorNote: 'StringBuffer and StringBuilder are like wet clay; you can reshape them constantly without throwing them away.',
    criminal: 'Valid Mutable String'
  },
  {
    id: 'U5-01',
    title: 'The Dead Button',
    topic: 'JAVAFX_DIVISION',
    difficulty: 'Rookie',
    difficultyColor: 'green',
    xpReward: 100,
    filename: 'UI.java',
    description: 'Event Handling Basics.',
    bannerSnippet: 'Button btn = new Button("Scan Evidence"); <span class="text-crimson">// Nothing happens on click</span>',
    code: [
        { text: '<span class="class-name">Button</span> btn = <span class="keyword">new</span> <span class="class-name">Button</span>(<span class="string">"Scan Evidence"</span>);', bug: false },
        { text: '', bug: false },
        { text: '<span class="comment">// Add button to layout...</span>', bug: false },
        { text: '<span class="class-name">VBox</span> layout = <span class="keyword">new</span> <span class="class-name">VBox</span>(btn);', bug: false }
      ],
    clues: [
        { text: 'The button is created and added to the layout.', icon: '🔍' },
        { text: 'It is visible on the screen and can be clicked physically.', icon: '👁️' },
        { text: 'However, there is no code telling the application what to do when a click occurs.', icon: '🔌' }
      ],
    suspects: [
        { name: 'Missing Action Handler', icon: '🔌', correct: true },
        { name: 'NullPointerException', icon: '💀', correct: false },
        { name: 'Button Not Enabled', icon: '🔒', correct: false },
        { name: 'Compilation Error', icon: '❌', correct: false }
      ],
    reasons: [
        { text: 'JavaFX controls need an EventHandler attached to them to respond to interactions', correct: true },
        { text: 'The Button class must be overridden', correct: false },
        { text: 'VBox layouts disable buttons by default', correct: false },
        { text: 'The button\'s text is invalid', correct: false }
      ],
    fixes: [
        { text: 'btn.setOnAction(event -> { System.out.println("Scanning..."); });', correct: true },
        { text: 'btn.setClickable(true);', correct: false },
        { text: 'btn.start();', correct: false },
        { text: 'layout.enable(btn);', correct: false }
      ],
    detectorNote: 'A button without an action handler is like a doorbell not connected to a bell.',
    criminal: 'Missing Event Handler'
  },
  {
    id: 'U5-02',
    title: 'The Missing Click',
    topic: 'JAVAFX_DIVISION',
    difficulty: 'Code Investigator',
    difficultyColor: 'amber',
    xpReward: 150,
    filename: 'ImagePanel.java',
    description: 'Mouse Events on generic nodes.',
    bannerSnippet: 'imageView.<span class="text-crimson">setOnAction</span>(e -> zoom());',
    code: [
        { text: '<span class="class-name">ImageView</span> imageView = <span class="keyword">new</span> <span class="class-name">ImageView</span>(evidencePhoto);', bug: false },
        { text: '', bug: false },
        { text: '<span class="comment">// We want to zoom when the user clicks the photo</span>', bug: false },
        { text: 'imageView.<span class="method">setOnAction</span>(e -> <span class="method">zoom</span>());', bug: true }
      ],
    clues: [
        { text: 'The code attempts to attach an action to an ImageView.', icon: '🔍' },
        { text: 'Buttons use setOnAction() for standard clicks.', icon: '🔘' },
        { text: 'ImageView is not a Button. It does not have an \'Action\' event natively.', icon: '🚫' }
      ],
    suspects: [
        { name: 'Compilation Error', icon: '❌', correct: true },
        { name: 'NullPointerException', icon: '💀', correct: false },
        { name: 'Missing inheritance', icon: '🧬', correct: false },
        { name: 'TypeMismatch', icon: '🎭', correct: false }
      ],
    reasons: [
        { text: 'ImageView does not have a setOnAction method; you must use mouse events', correct: true },
        { text: 'ImageView cannot be clicked', correct: false },
        { text: 'The zoom method requires parameters', correct: false },
        { text: 'Images must be wrapped in Buttons first', correct: false }
      ],
    fixes: [
        { text: 'imageView.setOnMouseClicked(e -> zoom());', correct: true },
        { text: 'imageView.setClickable(true);', correct: false },
        { text: 'imageView.addEventHandler(ActionEvent.ACTION, e -> zoom());', correct: false },
        { text: 'imageView.addEventFilter(KeyEvent.KEY_PRESSED, e -> zoom());', correct: false }
      ],
    detectorNote: 'Not everything has an \'Action\'. For generic nodes like images, you listen for raw MouseEvents.',
    criminal: 'Invalid Event Type'
  },
  {
    id: 'U5-03',
    title: 'The Silent Keyboard',
    topic: 'JAVAFX_DIVISION',
    difficulty: 'Code Investigator',
    difficultyColor: 'amber',
    xpReward: 150,
    filename: 'Terminal.java',
    description: 'Key Event handling.',
    bannerSnippet: 'scene.<span class="text-crimson">setOnKeyTyped</span>(e -> { ... });',
    code: [
        { text: '<span class="class-name">Scene</span> scene = <span class="keyword">new</span> <span class="class-name">Scene</span>(root);', bug: false },
        { text: '', bug: false },
        { text: '<span class="comment">// We want to detect if the user holds down the SHIFT key</span>', bug: false },
        { text: 'scene.<span class="method">setOnKeyTyped</span>(e -> {', bug: true },
        { text: '    <span class="keyword">if</span> (e.<span class="method">isShiftDown</span>()) {', bug: false },
        { text: '        <span class="class-name">System</span>.<span class="variable">out</span>.<span class="method">println</span>(<span class="string">"Shift held"</span>);', bug: false },
        { text: '    }', bug: false },
        { text: '});', bug: true }
      ],
    clues: [
        { text: 'The developer wants to detect when the SHIFT key is held down.', icon: '🔍' },
        { text: 'KEY_TYPED events are only fired for printable characters (like \'A\', \'1\', \'?\').', icon: '🔤' },
        { text: 'Modifier keys like SHIFT, CTRL, and ALT do not produce a typed character.', icon: '🔇' }
      ],
    suspects: [
        { name: 'Invalid Event Type', icon: '🚫', correct: true },
        { name: 'NullPointerException', icon: '💀', correct: false },
        { name: 'Compilation Error', icon: '❌', correct: false },
        { name: 'Missing Focus', icon: '🎯', correct: false }
      ],
    reasons: [
        { text: 'Modifier keys don\'t fire KeyTyped events; you must use KeyPressed', correct: true },
        { text: 'You cannot detect modifier keys in JavaFX', correct: false },
        { text: 'The scene cannot listen to keyboard events', correct: false },
        { text: 'isShiftDown is not a valid method', correct: false }
      ],
    fixes: [
        { text: 'scene.setOnKeyPressed(e -> { if (e.isShiftDown()) ... });', correct: true },
        { text: 'scene.setOnKeyReleased(...);', correct: false },
        { text: 'scene.addEventHandler(MouseEvent.MOUSE_CLICKED, ...);', correct: false },
        { text: 'e.getCharacter().equals("SHIFT")', correct: false }
      ],
    detectorNote: 'If you want to catch invisible keys (like Shift or Arrows), you must listen for them being *pressed*, not typed.',
    criminal: 'Incorrect Key Event'
  },
  {
    id: 'U5-04',
    title: 'The Checkbox Alibi',
    topic: 'JAVAFX_DIVISION',
    difficulty: 'Rookie',
    difficultyColor: 'green',
    xpReward: 100,
    filename: 'SuspectForm.java',
    description: 'Checkbox vs RadioButton mechanics.',
    bannerSnippet: 'Has Tattoo: ○ Has Scar: ○ <span class="text-crimson">// (Mutually exclusive)</span>',
    code: [
        { text: '<span class="comment">// We need to record multiple identifying marks</span>', bug: false },
        { text: '<span class="class-name">RadioButton</span> rb1 = <span class="keyword">new</span> <span class="class-name">RadioButton</span>(<span class="string">"Has Tattoo"</span>);', bug: true },
        { text: '<span class="class-name">RadioButton</span> rb2 = <span class="keyword">new</span> <span class="class-name">RadioButton</span>(<span class="string">"Has Scar"</span>);', bug: true },
        { text: '', bug: false },
        { text: '<span class="class-name">ToggleGroup</span> group = <span class="keyword">new</span> <span class="class-name">ToggleGroup</span>();', bug: true },
        { text: 'rb1.<span class="method">setToggleGroup</span>(group);', bug: true },
        { text: 'rb2.<span class="method">setToggleGroup</span>(group);', bug: true }
      ],
    clues: [
        { text: 'The UI asks the detective to check identifying marks (Tattoo, Scar).', icon: '🔍' },
        { text: 'A suspect can have BOTH a tattoo and a scar.', icon: '👥' },
        { text: 'RadioButtons in a ToggleGroup enforce mutually exclusive choices (only ONE can be selected).', icon: '⚖️' }
      ],
    suspects: [
        { name: 'Incorrect UI Control', icon: '🎛️', correct: true },
        { name: 'NullPointerException', icon: '💀', correct: false },
        { name: 'Compilation Error', icon: '❌', correct: false },
        { name: 'Missing Event Handler', icon: '🔌', correct: false }
      ],
    reasons: [
        { text: 'RadioButtons force single-selection. For multiple selections, CheckBoxes must be used', correct: true },
        { text: 'ToggleGroups are deprecated in JavaFX', correct: false },
        { text: 'The ToggleGroup is not added to the layout', correct: false },
        { text: 'RadioButtons cannot have text labels', correct: false }
      ],
    fixes: [
        { text: 'Use CheckBox instead: CheckBox cb1 = new CheckBox("Has Tattoo"); CheckBox cb2 = new CheckBox("Has Scar");', correct: true },
        { text: 'Remove the ToggleGroup entirely.', correct: false },
        { text: 'Set RadioButtons to multiSelect = true', correct: false },
        { text: 'Use a ChoiceBox', correct: false }
      ],
    detectorNote: 'Circles (Radio) mean \'Pick ONE\'. Squares (Checkbox) mean \'Pick ANY\'.',
    criminal: 'Incorrect UI Control'
  },
  {
    id: 'U5-05',
    title: 'The Toggle Conflict',
    topic: 'JAVAFX_DIVISION',
    difficulty: 'Rookie',
    difficultyColor: 'green',
    xpReward: 100,
    filename: 'Settings.java',
    description: 'Radio Buttons missing a ToggleGroup.',
    bannerSnippet: 'Difficulty: ◉ Easy ◉ Medium ◉ Hard <span class="text-crimson">// Wait, all are selected?!</span>',
    code: [
        { text: '<span class="class-name">RadioButton</span> r1 = <span class="keyword">new</span> <span class="class-name">RadioButton</span>(<span class="string">"Easy"</span>);', bug: false },
        { text: '<span class="class-name">RadioButton</span> r2 = <span class="keyword">new</span> <span class="class-name">RadioButton</span>(<span class="string">"Medium"</span>);', bug: false },
        { text: '<span class="class-name">RadioButton</span> r3 = <span class="keyword">new</span> <span class="class-name">RadioButton</span>(<span class="string">"Hard"</span>);', bug: false },
        { text: '', bug: false },
        { text: '<span class="class-name">VBox</span> layout = <span class="keyword">new</span> <span class="class-name">VBox</span>(r1, r2, r3);', bug: true }
      ],
    clues: [
        { text: 'The user is supposed to select ONLY ONE difficulty level.', icon: '🔍' },
        { text: 'RadioButtons are used, which is correct for single choices.', icon: '🔘' },
        { text: 'However, they currently act independently, allowing all three to be selected simultaneously.', icon: '⚠️' }
      ],
    suspects: [
        { name: 'Missing Event Handler', icon: '🔌', correct: false },
        { name: 'Missing ToggleGroup', icon: '🔗', correct: true },
        { name: 'Incorrect UI Control', icon: '🎛️', correct: false },
        { name: 'Layout Error', icon: '📐', correct: false }
      ],
    reasons: [
        { text: 'RadioButtons do not know they belong together unless assigned to the same ToggleGroup', correct: true },
        { text: 'They should be CheckBoxes', correct: false },
        { text: 'You must write an if-statement in the Event Handler to uncheck the others', correct: false },
        { text: 'They are placed in a VBox instead of an HBox', correct: false }
      ],
    fixes: [
        { text: 'ToggleGroup g = new ToggleGroup(); r1.setToggleGroup(g); r2.setToggleGroup(g); r3.setToggleGroup(g);', correct: true },
        { text: 'r1.setSingleSelect(true);', correct: false },
        { text: 'layout.setToggleGroup(true);', correct: false },
        { text: 'Use ChoiceBox instead', correct: false }
      ],
    detectorNote: 'Radio buttons are solitary creatures. You must group them up to make them work as a team.',
    criminal: 'Missing ToggleGroup'
  },
  {
    id: 'U5-06',
    title: 'The Selection Mystery',
    topic: 'JAVAFX_DIVISION',
    difficulty: 'Code Investigator',
    difficultyColor: 'amber',
    xpReward: 150,
    filename: 'Database.java',
    description: 'Control Selection: ListView vs ComboBox.',
    bannerSnippet: 'We need to select a criminal from <span class="text-crimson">1,000 records</span>.',
    code: [
        { text: '<span class="comment">// Requirement: User must select ONE criminal from a list of 1,000.</span>', bug: false },
        { text: '<span class="comment">// The UI space is very limited (only 1 row high available).</span>', bug: false },
        { text: '<span class="comment">// Which JavaFX control is the correct suspect?</span>', bug: false }
      ],
    clues: [
        { text: 'Requirement 1: Select ONE item from a very large list.', icon: '🔍' },
        { text: 'Requirement 2: UI space is limited (1 row high).', icon: '📏' },
        { text: 'A ListView displays multiple rows at once.', icon: '📋' }
      ],
    suspects: [
        { name: 'ListView', icon: '📋', correct: false },
        { name: 'ComboBox', icon: '🔽', correct: true },
        { name: 'RadioButton', icon: '🔘', correct: false },
        { name: 'TextField', icon: '📝', correct: false }
      ],
    reasons: [
        { text: 'ComboBox provides a dropdown menu, saving space while supporting large datasets', correct: true },
        { text: 'ListView is the only control that can hold 1,000 items', correct: false },
        { text: '1,000 RadioButtons is the most efficient choice', correct: false },
        { text: 'TextField allows users to type perfectly every time', correct: false }
      ],
    fixes: [
        { text: 'ComboBox<String> criminals = new ComboBox<>();', correct: true },
        { text: 'ListView<String> criminals = new ListView<>();', correct: false },
        { text: 'ChoiceBox<String> criminals = new ChoiceBox<>(); // Good for small lists, bad for 1000', correct: false },
        { text: 'ToggleGroup group = new ToggleGroup();', correct: false }
      ],
    detectorNote: 'When space is tight and suspects are many, a dropdown (ComboBox) is your best tool.',
    criminal: 'Incorrect Control Choice'
  },
  {
    id: 'U5-07',
    title: 'The Missing Text',
    topic: 'JAVAFX_DIVISION',
    difficulty: 'Code Investigator',
    difficultyColor: 'amber',
    xpReward: 150,
    filename: 'Report.java',
    description: 'Text Controls: TextField vs TextArea.',
    bannerSnippet: 'TextField report = <span class="text-crimson">new TextField();</span>',
    code: [
        { text: '<span class="comment">// UI for entering a long, multi-paragraph investigation report</span>', bug: false },
        { text: '<span class="class-name">TextField</span> reportInput = <span class="keyword">new</span> <span class="class-name">TextField</span>();', bug: true },
        { text: 'reportInput.<span class="method">setPrefHeight</span>(<span class="number">300</span>);', bug: true },
        { text: 'reportInput.<span class="method">setPrefWidth</span>(<span class="number">400</span>);', bug: true }
      ],
    clues: [
        { text: 'The developer wants the user to enter a multi-paragraph report.', icon: '🔍' },
        { text: 'They increased the height of the TextField to 300 pixels.', icon: '📏' },
        { text: 'TextField only supports a SINGLE line of text, regardless of how tall you make it.', icon: '⚠️' }
      ],
    suspects: [
        { name: 'Incorrect UI Control', icon: '🎛️', correct: true },
        { name: 'Missing ScrollPane', icon: '📜', correct: false },
        { name: 'Layout Error', icon: '📐', correct: false },
        { name: 'NullPointerException', icon: '💀', correct: false }
      ],
    reasons: [
        { text: 'TextFields are single-line. For multi-line text, a TextArea is required', correct: true },
        { text: 'You must wrap the TextField in a ScrollPane to get multiple lines', correct: false },
        { text: 'The width must be larger than the height', correct: false },
        { text: 'Text cannot be entered into JavaFX without a KeyboardEvent handler', correct: false }
      ],
    fixes: [
        { text: 'TextArea reportInput = new TextArea();', correct: true },
        { text: 'reportInput.setMultiLine(true);', correct: false },
        { text: 'ScrollPane sp = new ScrollPane(reportInput);', correct: false },
        { text: 'PasswordField reportInput = new PasswordField();', correct: false }
      ],
    detectorNote: 'A field is a single strip of land. An area is a whole field. Use TextArea for big paragraphs!',
    criminal: 'Incorrect Control Choice'
  },
  {
    id: 'U5-08',
    title: 'The Layout Disaster',
    topic: 'JAVAFX_DIVISION',
    difficulty: 'Senior Investigator',
    difficultyColor: 'crimson',
    xpReward: 250,
    filename: 'MainView.java',
    description: 'Understanding JavaFX Layouts.',
    bannerSnippet: 'HBox root = <span class="text-crimson">new HBox(topMenu, leftNav, centerContent);</span>',
    code: [
        { text: '<span class="comment">// We want a standard application layout:</span>', bug: false },
        { text: '<span class="comment">// Menu at TOP, Navigation on LEFT, Content in CENTER</span>', bug: false },
        { text: '', bug: false },
        { text: '<span class="class-name">HBox</span> root = <span class="keyword">new</span> <span class="class-name">HBox</span>();', bug: true },
        { text: 'root.<span class="method">getChildren</span>().<span class="method">addAll</span>(topMenu, leftNav, centerContent);', bug: true }
      ],
    clues: [
        { text: 'The developer wants components explicitly pinned to Top, Left, and Center.', icon: '🔍' },
        { text: 'HBox aligns all its children in a single horizontal row from left to right.', icon: '➡️' },
        { text: 'The result is the Menu, Navigation, and Content side-by-side in a single line.', icon: '❌' }
      ],
    suspects: [
        { name: 'VBox', icon: '⬇️', correct: false },
        { name: 'BorderPane', icon: '🖼️', correct: true },
        { name: 'GridPane', icon: '🔲', correct: false },
        { name: 'StackPane', icon: '🥞', correct: false }
      ],
    reasons: [
        { text: 'BorderPane explicitly defines Top, Bottom, Left, Right, and Center regions', correct: true },
        { text: 'VBox puts them in a vertical column, which doesn\'t fit the requirement', correct: false },
        { text: 'GridPane requires manual coordinate calculations for every element', correct: false },
        { text: 'StackPane places them on top of each other', correct: false }
      ],
    fixes: [
        { text: 'BorderPane root = new BorderPane(); root.setTop(topMenu); root.setLeft(leftNav); root.setCenter(centerContent);', correct: true },
        { text: 'VBox root = new VBox(topMenu, leftNav, centerContent);', correct: false },
        { text: 'StackPane root = new StackPane(topMenu, leftNav, centerContent);', correct: false },
        { text: 'FlowPane root = new FlowPane(topMenu, leftNav, centerContent);', correct: false }
      ],
    detectorNote: 'If a UI has a top header, a side nav, and a big center area, it is almost certainly a BorderPane.',
    criminal: 'Incorrect Layout Container'
  },
  {
    id: 'U5-09',
    title: 'The Hidden Evidence',
    topic: 'JAVAFX_DIVISION',
    difficulty: 'Code Investigator',
    difficultyColor: 'amber',
    xpReward: 150,
    filename: 'Gallery.java',
    description: 'Scrolling in JavaFX.',
    bannerSnippet: 'VBox gallery = new VBox(); <span class="text-crimson">// 50 images added</span>',
    code: [
        { text: '<span class="comment">// Displaying 50 suspect photos in a vertical column</span>', bug: false },
        { text: '<span class="class-name">VBox</span> gallery = <span class="keyword">new</span> <span class="class-name">VBox</span>();', bug: false },
        { text: '<span class="keyword">for</span> (<span class="class-name">Image</span> img : suspectPhotos) {', bug: false },
        { text: '    gallery.<span class="method">getChildren</span>().<span class="method">add</span>(<span class="keyword">new</span> <span class="class-name">ImageView</span>(img));', bug: false },
        { text: '}', bug: false },
        { text: '', bug: false },
        { text: '<span class="class-name">Scene</span> scene = <span class="keyword">new</span> <span class="class-name">Scene</span>(gallery, <span class="number">400</span>, <span class="number">600</span>);', bug: true }
      ],
    clues: [
        { text: '50 images are stacked vertically in a VBox.', icon: '🔍' },
        { text: 'The Scene is only 600 pixels tall.', icon: '📏' },
        { text: 'Most of the images spill off the bottom of the screen and cannot be reached.', icon: '🙈' }
      ],
    suspects: [
        { name: 'Missing ScrollPane', icon: '📜', correct: true },
        { name: 'Layout Error', icon: '📐', correct: false },
        { name: 'Missing EventHandler', icon: '🔌', correct: false },
        { name: 'Compilation Error', icon: '❌', correct: false }
      ],
    reasons: [
        { text: 'VBox does not provide scrollbars automatically. It must be wrapped in a ScrollPane.', correct: true },
        { text: 'The Scene automatically provides scrollbars but they are hidden', correct: false },
        { text: 'VBox is the wrong layout, HBox should be used', correct: false },
        { text: 'The images are too large and must be resized', correct: false }
      ],
    fixes: [
        { text: 'ScrollPane scroll = new ScrollPane(gallery); Scene scene = new Scene(scroll, 400, 600);', correct: true },
        { text: 'gallery.setScrollable(true);', correct: false },
        { text: 'scene.enableScrolling();', correct: false },
        { text: 'ListView gallery = new ListView();', correct: false }
      ],
    detectorNote: 'JavaFX layouts just grow. If you want a window into that growing layout, you need a ScrollPane.',
    criminal: 'Missing Scroll View'
  },
  {
    id: 'U5-10',
    title: 'The Broken Menu Bar',
    topic: 'JAVAFX_DIVISION',
    difficulty: 'Senior Investigator',
    difficultyColor: 'crimson',
    xpReward: 300,
    filename: 'MenuBar.java',
    description: 'Constructing JavaFX Menus.',
    bannerSnippet: 'MenuBar bar = <span class="text-crimson">new MenuBar(fileMenuItem);</span>',
    code: [
        { text: '<span class="comment">// We want a top bar with "File" -> "Exit"</span>', bug: false },
        { text: '<span class="class-name">MenuItem</span> exitItem = <span class="keyword">new</span> <span class="class-name">MenuItem</span>(<span class="string">"Exit"</span>);', bug: false },
        { text: '', bug: false },
        { text: '<span class="class-name">MenuBar</span> bar = <span class="keyword">new</span> <span class="class-name">MenuBar</span>();', bug: false },
        { text: 'bar.<span class="method">getMenus</span>().<span class="method">add</span>(exitItem);', bug: true }
      ],
    clues: [
        { text: 'A MenuBar holds Menus.', icon: '🔍' },
        { text: 'A Menu holds MenuItems.', icon: '📂' },
        { text: 'The code tries to add a MenuItem directly into the MenuBar.', icon: '🚫' }
      ],
    suspects: [
        { name: 'Compilation Error', icon: '❌', correct: true },
        { name: 'NullPointerException', icon: '💀', correct: false },
        { name: 'ClassCastException', icon: '🎭', correct: false },
        { name: 'Missing EventHandler', icon: '🔌', correct: false }
      ],
    reasons: [
        { text: 'MenuBar only accepts Menu objects, not MenuItems', correct: true },
        { text: 'MenuItem is abstract and cannot be instantiated', correct: false },
        { text: 'The MenuBar is not added to the layout', correct: false },
        { text: 'The exitItem has no action event', correct: false }
      ],
    fixes: [
        { text: 'Menu fileMenu = new Menu("File"); fileMenu.getItems().add(exitItem); bar.getMenus().add(fileMenu);', correct: true },
        { text: 'bar.getItems().add(exitItem);', correct: false },
        { text: 'bar.getChildren().add(exitItem);', correct: false },
        { text: 'Menu fileMenu = new Menu("File", exitItem);', correct: false }
      ],
    detectorNote: 'MenuBars hold Menus (File, Edit). Menus hold MenuItems (Save, Copy). Respect the hierarchy!',
    criminal: 'Hierarchy Violation'
  }
];

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
  { id: 'DATA_TYPES', label: 'Data Types & Operators', division: 'Unit I - Basics', cases: ['U1-01','U1-02','U1-03'], solved: 3 },
  { id: 'CONTROL_STATEMENTS', label: 'Control Statements', division: 'Unit I - Basics', cases: ['U1-04'], solved: 0 },
  { id: 'CLASSES_OBJECTS', label: 'Classes & Objects', division: 'Unit I - Basics', cases: ['U1-05','U1-06','U1-07','U1-08','U1-09','U1-10'], solved: 0 },
  { id: 'OOP_DIVISION', label: 'OOP - Inheritance & Polymorphism', division: 'Unit II - OOP', cases: ['U2-01','U2-02','U2-03','U2-04','U2-05','U2-06','U2-07','U2-08','U2-09','U2-10'], solved: 0 },
  { id: 'EXCEPTIONS_THREADS', label: 'Exceptions & Threads', division: 'Unit III - Exceptions & Threads', cases: ['U3-01','U3-02','U3-03','U3-04','U3-05','U3-06','U3-07','U3-08','U3-09','U3-10'], solved: 0 },
  { id: 'IO_GENERICS', label: 'I/O, Strings & Generics', division: 'Unit IV - I/O & Generics', cases: ['U4-01','U4-02','U4-03','U4-04','U4-05','U4-06','U4-07','U4-08','U4-09','U4-10'], solved: 0 },
  { id: 'JAVAFX_DIVISION', label: 'JavaFX UI', division: 'Unit V - JavaFX', cases: ['U5-01','U5-02','U5-03','U5-04','U5-05','U5-06','U5-07','U5-08','U5-09','U5-10'], solved: 0 }
];

const RANKS = [
  { name: 'Rookie Debugger', threshold: 0, icon: '🔍' },
  { name: 'Code Investigator', threshold: 500, icon: '🕵️' },
  { name: 'Senior Code Inspector', threshold: 1000, icon: '⭐' },
  { name: 'Master Detective', threshold: 2000, icon: '🏆' },
  { name: 'Chief of Code Police', threshold: 4000, icon: '👑' }
,
  {
    name: 'Static State Mutator',
    icon: '🌟',
    description: 'Exploits shared static state to corrupt all instances.'
  },
  {
    name: 'Incorrect condition ordering',
    icon: '🔀',
    description: 'Places broader conditions before specific ones, blocking code paths.'
  },
  {
    name: 'Missing Return',
    icon: '📤',
    description: 'Leaves methods without the promised return value.'
  },
  {
    name: 'Unimplemented Interface',
    icon: '🤝',
    description: 'Signs contracts but refuses to fulfill them.'
  },
  {
    name: 'Invalid Event Type',
    icon: '🚫',
    description: 'Attaches button events to non-button UI nodes.'
  },
  {
    name: 'Incorrect Layout Container',
    icon: '📐',
    description: 'Uses the wrong layout pane for the required UI structure.'
  },
  {
    name: 'Incorrect method override',
    icon: '🔀',
    description: 'Uses typos to fake overrides that never execute.'
  },
  {
    name: 'Duplicate Method Signature',
    icon: '📋',
    description: 'Creates fake overloads causing compiler ambiguity.'
  },
  {
    name: 'Reference Mutation',
    icon: '🔗',
    description: 'Silently modifies objects through shared references.'
  },
  {
    name: 'Incorrect Control Choice',
    icon: '🎛️',
    description: 'Chooses a space-inefficient control for a limited UI area.'
  },
  {
    name: 'TypeMismatch',
    icon: '🎭',
    description: 'Assigns incompatible types to each other.'
  },
  {
    name: 'Type Bound Violation',
    icon: '🚫',
    description: 'Passes types that violate generic type bounds.'
  },
  {
    name: 'Operator Precedence',
    icon: '⚖️',
    description: 'Manipulates calculation order to produce wrong results.'
  },
  {
    name: 'String Immutability',
    icon: '🔒',
    description: 'Discards string operations by ignoring the returned new string.'
  },
  {
    name: 'Unhandled Checked Exception',
    icon: '📄',
    description: 'Ignores mandatory exception handling for file operations.'
  },
  {
    name: 'Missing ToggleGroup',
    icon: '🔗',
    description: 'Creates radio buttons without grouping them together.'
  },
  {
    name: 'Missing Scroll View',
    icon: '📜',
    description: 'Allows content to overflow the screen with no scrolling.'
  },
  {
    name: 'Missing Event Handler',
    icon: '🔌',
    description: 'Creates UI controls with no response to user interaction.'
  },
  {
    name: 'Generic Erasure Rule Violation',
    icon: '👻',
    description: 'Attempts to instantiate erased generic types at runtime.'
  },
  {
    name: 'Missing Generic Declaration',
    icon: '🔠',
    description: 'Forgets the type parameter in generic class definition.'
  },
  {
    name: 'Unreachable Catch Block',
    icon: '🔀',
    description: 'Places broad catches before specific ones, intercepting all crimes.'
  },
  {
    name: 'Encapsulation Violation',
    icon: '🔒',
    description: 'Breaks private access barriers to steal data.'
  },
  {
    name: 'Constructor Mismatch',
    icon: '🏗️',
    description: 'Calls constructors with wrong argument counts.'
  },
  {
    name: 'NullPointerException',
    icon: '💀',
    description: 'Calls methods on empty references, causing instant crashes.'
  },
  {
    name: 'Parent constructor mismatch',
    icon: '🧬',
    description: 'Forces subclass to call non-existent parent constructors.'
  },
  {
    name: 'Incorrect Thread Invocation',
    icon: '🌟',
    description: 'Calls run() instead of start(), keeping everything single-threaded.'
  },
  {
    name: 'Valid Mutable String',
    icon: '📝',
    description: 'StringBuffer modifying itself correctly in place.'
  },
  {
    name: 'Missing Synchronization',
    icon: '🔒',
    description: 'Leaves critical sections unprotected from concurrent access.'
  },
  {
    name: 'Abstract Instantiation',
    icon: '👻',
    description: 'Attempts to give life to incomplete abstract blueprints.'
  },
  {
    name: 'Raw Type Safety Violation',
    icon: '📦',
    description: 'Uses untyped collections to smuggle wrong data types.'
  },
  {
    name: 'ArrayIndexOutOfBoundsException',
    icon: '📊',
    description: 'Accesses array memory beyond its boundaries.'
  },
  {
    name: 'Resource Leak',
    icon: '🔓',
    description: 'Opens files and streams but never closes them.'
  },
  {
    name: 'Incorrect Comment Format',
    icon: '📝',
    description: 'Uses wrong comment format to hide documentation.'
  },
  {
    name: 'Autoboxing Concept',
    icon: '📦',
    description: 'The silent converter between primitives and wrapper objects.'
  },
  {
    name: 'Race Condition',
    icon: '🏃',
    description: 'Exploits thread timing to corrupt shared state.'
  },
  {
    name: 'Invalid Inner Instantiation',
    icon: '❌',
    description: 'Attempts to create inner class without outer instance.'
  },
  {
    name: 'Missing Inheritance',
    icon: '🧬',
    description: 'Severs class hierarchy to break method access.'
  },
  {
    name: 'Numeric overflow',
    icon: '🌊',
    description: 'Exploits integer limits to corrupt numeric data.'
  },
  {
    name: 'Runtime Polymorphism',
    icon: '🎭',
    description: 'Hides true identity behind parent type references.'
  },
  {
    name: 'ArithmeticException',
    icon: '➗',
    description: 'Performs mathematically illegal division operations.'
  },
  {
    name: 'Hierarchy Violation',
    icon: '🏗️',
    description: 'Inserts MenuItems directly into MenuBar bypassing Menu layer.'
  },
  {
    name: 'Incorrect Key Event',
    icon: '⌨️',
    description: 'Listens for typed events on modifier-only keys.'
  },
  {
    name: 'Valid Generic Method',
    icon: '🔴',
    description: 'A cunning Java criminal.'
  },
  {
    name: 'Missing Blueprint',
    icon: '🏗️',
    description: 'Destroys class structure making objects unreachable.'
  },
  {
    name: 'Undeclared Checked Exception',
    icon: '📜',
    description: 'Throws checked exceptions without declaring them.'
  },
  {
    name: 'Incorrect UI Control',
    icon: '🎛️',
    description: 'Uses single-select controls for multi-select requirements.'
  },
  {
    name: 'Thread Deadlock / Sleeping',
    icon: '💤',
    description: 'Puts threads to sleep with no mechanism to wake them.'
  },
  {
    name: 'Nested Exception Propagation',
    icon: '🪤',
    description: 'Uses nested traps to redirect exceptions to the wrong handler.'
  }
];
CRIMINALS.push(...[
  {
    name: 'Missing ToggleGroup',
    icon: '🔗',
    description: 'Creates radio buttons without grouping them together.'
  },
  {
    name: 'Missing Event Handler',
    icon: '🔌',
    description: 'Creates UI controls with no response to user interaction.'
  },
  {
    name: 'Thread Deadlock / Sleeping',
    icon: '💤',
    description: 'Puts threads to sleep with no mechanism to wake them.'
  },
  {
    name: 'Type Bound Violation',
    icon: '🚫',
    description: 'Passes types that violate generic type bounds.'
  },
  {
    name: 'Hierarchy Violation',
    icon: '🏗️',
    description: 'Inserts MenuItems directly into MenuBar bypassing Menu layer.'
  },
  {
    name: 'Static State Mutator',
    icon: '🌟',
    description: 'Exploits shared static state to corrupt all instances.'
  },
  {
    name: 'Missing Return',
    icon: '📤',
    description: 'Leaves methods without the promised return value.'
  },
  {
    name: 'Incorrect Control Choice',
    icon: '🎛️',
    description: 'Chooses a space-inefficient control for a limited UI area.'
  },
  {
    name: 'Generic Erasure Rule Violation',
    icon: '👻',
    description: 'Attempts to instantiate erased generic types at runtime.'
  },
  {
    name: 'ArrayIndexOutOfBoundsException',
    icon: '📊',
    description: 'Accesses array memory beyond its boundaries.'
  },
  {
    name: 'Incorrect Thread Invocation',
    icon: '🌟',
    description: 'Calls run() instead of start(), keeping everything single-threaded.'
  },
  {
    name: 'TypeMismatch',
    icon: '🎭',
    description: 'Assigns incompatible types to each other.'
  },
  {
    name: 'Missing Scroll View',
    icon: '📜',
    description: 'Allows content to overflow the screen with no scrolling.'
  },
  {
    name: 'Incorrect Comment Format',
    icon: '📝',
    description: 'Uses wrong comment format to hide documentation.'
  },
  {
    name: 'Missing Inheritance',
    icon: '🧬',
    description: 'Severs class hierarchy to break method access.'
  },
  {
    name: 'Valid Generic Method',
    icon: '🔴',
    description: 'A cunning Java criminal.'
  },
  {
    name: 'Raw Type Safety Violation',
    icon: '📦',
    description: 'Uses untyped collections to smuggle wrong data types.'
  },
  {
    name: 'Invalid Event Type',
    icon: '🚫',
    description: 'Attaches button events to non-button UI nodes.'
  },
  {
    name: 'Nested Exception Propagation',
    icon: '🪤',
    description: 'Uses nested traps to redirect exceptions to the wrong handler.'
  },
  {
    name: 'Unreachable Catch Block',
    icon: '🔀',
    description: 'Places broad catches before specific ones, intercepting all crimes.'
  },
  {
    name: 'Constructor Mismatch',
    icon: '🏗️',
    description: 'Calls constructors with wrong argument counts.'
  },
  {
    name: 'Incorrect Key Event',
    icon: '⌨️',
    description: 'Listens for typed events on modifier-only keys.'
  },
  {
    name: 'Encapsulation Violation',
    icon: '🔒',
    description: 'Breaks private access barriers to steal data.'
  },
  {
    name: 'Invalid Inner Instantiation',
    icon: '❌',
    description: 'Attempts to create inner class without outer instance.'
  },
  {
    name: 'Undeclared Checked Exception',
    icon: '📜',
    description: 'Throws checked exceptions without declaring them.'
  },
  {
    name: 'Duplicate Method Signature',
    icon: '📋',
    description: 'Creates fake overloads causing compiler ambiguity.'
  },
  {
    name: 'Numeric overflow',
    icon: '🌊',
    description: 'Exploits integer limits to corrupt numeric data.'
  },
  {
    name: 'Operator Precedence',
    icon: '⚖️',
    description: 'Manipulates calculation order to produce wrong results.'
  },
  {
    name: 'ArithmeticException',
    icon: '➗',
    description: 'Performs mathematically illegal division operations.'
  },
  {
    name: 'Missing Synchronization',
    icon: '🔒',
    description: 'Leaves critical sections unprotected from concurrent access.'
  },
  {
    name: 'Valid Mutable String',
    icon: '📝',
    description: 'StringBuffer modifying itself correctly in place.'
  },
  {
    name: 'Abstract Instantiation',
    icon: '👻',
    description: 'Attempts to give life to incomplete abstract blueprints.'
  },
  {
    name: 'Incorrect condition ordering',
    icon: '🔀',
    description: 'Places broader conditions before specific ones, blocking code paths.'
  },
  {
    name: 'Incorrect UI Control',
    icon: '🎛️',
    description: 'Uses single-select controls for multi-select requirements.'
  },
  {
    name: 'Incorrect method override',
    icon: '🔀',
    description: 'Uses typos to fake overrides that never execute.'
  },
  {
    name: 'Parent constructor mismatch',
    icon: '🧬',
    description: 'Forces subclass to call non-existent parent constructors.'
  },
  {
    name: 'Resource Leak',
    icon: '🔓',
    description: 'Opens files and streams but never closes them.'
  },
  {
    name: 'Race Condition',
    icon: '🏃',
    description: 'Exploits thread timing to corrupt shared state.'
  },
  {
    name: 'Reference Mutation',
    icon: '🔗',
    description: 'Silently modifies objects through shared references.'
  },
  {
    name: 'Unhandled Checked Exception',
    icon: '📄',
    description: 'Ignores mandatory exception handling for file operations.'
  },
  {
    name: 'Missing Blueprint',
    icon: '🏗️',
    description: 'Destroys class structure making objects unreachable.'
  },
  {
    name: 'Runtime Polymorphism',
    icon: '🎭',
    description: 'Hides true identity behind parent type references.'
  },
  {
    name: 'Missing Generic Declaration',
    icon: '🔠',
    description: 'Forgets the type parameter in generic class definition.'
  },
  {
    name: 'Autoboxing Concept',
    icon: '📦',
    description: 'The silent converter between primitives and wrapper objects.'
  },
  {
    name: 'String Immutability',
    icon: '🔒',
    description: 'Discards string operations by ignoring the returned new string.'
  },
  {
    name: 'NullPointerException',
    icon: '💀',
    description: 'Calls methods on empty references, causing instant crashes.'
  },
  {
    name: 'Unimplemented Interface',
    icon: '🤝',
    description: 'Signs contracts but refuses to fulfill them.'
  },
  {
    name: 'Incorrect Layout Container',
    icon: '📐',
    description: 'Uses the wrong layout pane for the required UI structure.'
  }
]);