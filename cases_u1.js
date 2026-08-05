CASES.push(...[
  {
    "id": "U1-01",
    "title": "The Overflowing Evidence",
    "topic": "DATA_TYPES",
    "difficulty": "Rookie",
    "difficultyColor": "green",
    "xpReward": 100,
    "filename": "Investigation.java",
    "description": "Java data types and integer overflow.",
    "bannerSnippet": "<span class=\"text-crimson\">evidence++</span>;",
    "code": [
      {
        "text": "<span class=\"type\">byte</span> evidence = <span class=\"number\">127</span>;",
        "bug": false
      },
      {
        "text": "evidence++;",
        "bug": true
      },
      {
        "text": "<span class=\"class-name\">System</span>.<span class=\"variable\">out</span>.<span class=\"method\">println</span>(evidence);",
        "bug": false
      }
    ],
    "clues": [
      {
        "text": "The variable 'evidence' is declared as a byte.",
        "icon": "\ud83d\udd0d"
      },
      {
        "text": "A byte in Java is an 8-bit signed integer.",
        "icon": "\ud83d\udcbe"
      },
      {
        "text": "The maximum value for a byte is 127. Incrementing past it causes an overflow to its minimum value (-128).",
        "icon": "\ud83c\udf0a"
      }
    ],
    "suspects": [
      {
        "name": "NullPointerException",
        "icon": "\ud83d\udc80",
        "correct": false
      },
      {
        "name": "Numeric overflow",
        "icon": "\ud83c\udf0a",
        "correct": true
      },
      {
        "name": "Compilation Error",
        "icon": "\u274c",
        "correct": false
      },
      {
        "name": "Syntax Error",
        "icon": "\ud83d\udeab",
        "correct": false
      }
    ],
    "reasons": [
      {
        "text": "Byte only holds positive numbers",
        "correct": false
      },
      {
        "text": "Exceeding the maximum positive limit wraps around to the negative limit",
        "correct": true
      },
      {
        "text": "Java doesn't support the ++ operator on bytes",
        "correct": false
      },
      {
        "text": "127 is already negative in byte representation",
        "correct": false
      }
    ],
    "fixes": [
      {
        "text": "int evidence = 127;",
        "correct": true
      },
      {
        "text": "byte evidence = 128;",
        "correct": false
      },
      {
        "text": "short evidence = 32000;",
        "correct": false
      },
      {
        "text": "char evidence = 127;",
        "correct": false
      }
    ],
    "detectorNote": "What is the maximum positive value of a byte? What happens if you add 1?",
    "criminal": "Numeric overflow"
  },
  {
    "id": "U1-02",
    "title": "The Array Boundary Breach",
    "topic": "ARRAYS",
    "difficulty": "Rookie",
    "difficultyColor": "green",
    "xpReward": 100,
    "filename": "Records.java",
    "description": "Accessing an array out of its bounds.",
    "bannerSnippet": "System.out.println(<span class=\"text-crimson\">marks[3]</span>);",
    "code": [
      {
        "text": "<span class=\"type\">int</span>[] marks = {<span class=\"number\">80</span>, <span class=\"number\">90</span>, <span class=\"number\">70</span>};",
        "bug": false
      },
      {
        "text": "",
        "bug": false
      },
      {
        "text": "<span class=\"class-name\">System</span>.<span class=\"variable\">out</span>.<span class=\"method\">println</span>(marks[<span class=\"number\">3</span>]);",
        "bug": true
      }
    ],
    "clues": [
      {
        "text": "The array 'marks' has exactly 3 elements.",
        "icon": "\ud83d\udd0d"
      },
      {
        "text": "Java arrays are zero-indexed, meaning the first element is at index 0.",
        "icon": "0\ufe0f\u20e3"
      },
      {
        "text": "The valid indices for this array are 0, 1, and 2. Index 3 does not exist.",
        "icon": "\ud83d\udeab"
      }
    ],
    "suspects": [
      {
        "name": "ArrayIndexOutOfBoundsException",
        "icon": "\ud83d\udcca",
        "correct": true
      },
      {
        "name": "NullPointerException",
        "icon": "\ud83d\udc80",
        "correct": false
      },
      {
        "name": "TypeMismatch",
        "icon": "\ud83c\udfad",
        "correct": false
      },
      {
        "name": "Compilation Error",
        "icon": "\u274c",
        "correct": false
      }
    ],
    "reasons": [
      {
        "text": "The array hasn't been initialized",
        "correct": false
      },
      {
        "text": "You are requesting index 3, but the maximum valid index is 2",
        "correct": true
      },
      {
        "text": "System.out.println cannot print integers",
        "correct": false
      },
      {
        "text": "The array syntax is incorrect",
        "correct": false
      }
    ],
    "fixes": [
      {
        "text": "System.out.println(marks[2]);",
        "correct": true
      },
      {
        "text": "System.out.println(marks[4]);",
        "correct": false
      },
      {
        "text": "System.out.println(marks);",
        "correct": false
      },
      {
        "text": "System.out.println(marks.get(3));",
        "correct": false
      }
    ],
    "detectorNote": "If length = 3, what are the valid indexes?",
    "criminal": "ArrayIndexOutOfBoundsException"
  },
  {
    "id": "U1-03",
    "title": "The Assignment Impostor",
    "topic": "OPERATORS",
    "difficulty": "Rookie",
    "difficultyColor": "green",
    "xpReward": 100,
    "filename": "total_dxp.java",
    "description": "Operator precedence and compound assignment.",
    "bannerSnippet": "total_dxp <span class=\"text-crimson\">+=</span> 10 * 2;",
    "code": [
      {
        "text": "<span class=\"type\">int</span> total_dxp = <span class=\"number\">50</span>;",
        "bug": false
      },
      {
        "text": "total_dxp += <span class=\"number\">10</span> * <span class=\"number\">2</span>;",
        "bug": true
      },
      {
        "text": "<span class=\"class-name\">System</span>.<span class=\"variable\">out</span>.<span class=\"method\">println</span>(total_dxp);",
        "bug": false
      }
    ],
    "clues": [
      {
        "text": "The total_dxp starts at 50.",
        "icon": "\ud83d\udd0d"
      },
      {
        "text": "Multiplication (*) has a higher precedence than compound assignment (+=).",
        "icon": "\u2696\ufe0f"
      },
      {
        "text": "First, 10 * 2 is evaluated (20). Then, 20 is added to 50.",
        "icon": "\ud83e\uddee"
      }
    ],
    "suspects": [
      {
        "name": "70",
        "icon": "\ud83c\udfaf",
        "correct": true
      },
      {
        "name": "120",
        "icon": "\u274c",
        "correct": false
      },
      {
        "name": "100",
        "icon": "\u274c",
        "correct": false
      },
      {
        "name": "60",
        "icon": "\u274c",
        "correct": false
      }
    ],
    "reasons": [
      {
        "text": "(50 + 10) * 2 = 120",
        "correct": false
      },
      {
        "text": "Multiplication executes first (10*2=20), then addition assignment (50+20=70)",
        "correct": true
      },
      {
        "text": "The compound operator just overrides the variable",
        "correct": false
      },
      {
        "text": "total_dxp is unchanged",
        "correct": false
      }
    ],
    "fixes": [
      {
        "text": "The correct output is 70",
        "correct": true
      },
      {
        "text": "The correct output is 120",
        "correct": false
      },
      {
        "text": "The correct output is 100",
        "correct": false
      },
      {
        "text": "The correct output is 60",
        "correct": false
      }
    ],
    "detectorNote": "Remember PEMDAS! Does multiplication or assignment happen first?",
    "criminal": "Operator Precedence"
  },
  {
    "id": "U1-04",
    "title": "The Unreachable Branch",
    "topic": "CONTROL_STATEMENTS",
    "difficulty": "Code Investigator",
    "difficultyColor": "amber",
    "xpReward": 150,
    "filename": "Grader.java",
    "description": "Incorrect condition ordering in an if-else chain.",
    "bannerSnippet": "<span class=\"text-crimson\">if (marks >= 40)</span>",
    "code": [
      {
        "text": "<span class=\"type\">int</span> marks = <span class=\"number\">85</span>;",
        "bug": false
      },
      {
        "text": "",
        "bug": false
      },
      {
        "text": "<span class=\"keyword\">if</span> (marks >= <span class=\"number\">40</span>)",
        "bug": true
      },
      {
        "text": "    <span class=\"class-name\">System</span>.<span class=\"variable\">out</span>.<span class=\"method\">println</span>(<span class=\"string\">\"Pass\"</span>);",
        "bug": false
      },
      {
        "text": "<span class=\"keyword\">else if</span> (marks >= <span class=\"number\">75</span>)",
        "bug": true
      },
      {
        "text": "    <span class=\"class-name\">System</span>.<span class=\"variable\">out</span>.<span class=\"method\">println</span>(<span class=\"string\">\"Distinction\"</span>);",
        "bug": false
      }
    ],
    "clues": [
      {
        "text": "The 'marks' variable is 85, which means they should get a Distinction.",
        "icon": "\ud83d\udd0d"
      },
      {
        "text": "An if-else chain evaluates from top to bottom and stops at the FIRST true condition.",
        "icon": "\u2696\ufe0f"
      },
      {
        "text": "Because 85 >= 40 is true, the first block executes and the rest are ignored.",
        "icon": "\u26a0\ufe0f"
      }
    ],
    "suspects": [
      {
        "name": "Variable shadowing",
        "icon": "\ud83d\udc65",
        "correct": false
      },
      {
        "name": "Incorrect condition ordering",
        "icon": "\ud83d\udd00",
        "correct": true
      },
      {
        "name": "Compilation Error",
        "icon": "\u274c",
        "correct": false
      },
      {
        "name": "NullPointerException",
        "icon": "\ud83d\udc80",
        "correct": false
      }
    ],
    "reasons": [
      {
        "text": "Java evaluates multiple true conditions but only prints the first one",
        "correct": false
      },
      {
        "text": "The broader condition is placed before the stricter condition, shadowing it",
        "correct": true
      },
      {
        "text": "Missing curly braces {}",
        "correct": false
      },
      {
        "text": "else if is not valid in Java",
        "correct": false
      }
    ],
    "fixes": [
      {
        "text": "if (marks >= 75) { ... } else if (marks >= 40) { ... }",
        "correct": true
      },
      {
        "text": "if (marks >= 40 && marks >= 75)",
        "correct": false
      },
      {
        "text": "if (marks == 75)",
        "correct": false
      },
      {
        "text": "else if (marks >= 85)",
        "correct": false
      }
    ],
    "detectorNote": "In an if-else chain, put the most specific or hardest-to-reach condition first!",
    "criminal": "Incorrect condition ordering"
  },
  {
    "id": "U1-05",
    "title": "The Missing Blueprint",
    "topic": "CLASSES_OBJECTS",
    "difficulty": "Rookie",
    "difficultyColor": "green",
    "xpReward": 100,
    "filename": "Main.java",
    "description": "Code Reconstruction of Classes and Objects.",
    "bannerSnippet": "<span class=\"text-crimson\">Student s = new Student();</span>",
    "code": [
      {
        "text": "<span class=\"comment\">// Fragmented Code:</span>",
        "bug": false
      },
      {
        "text": "Student s = new Student();",
        "bug": true
      },
      {
        "text": "class Student {",
        "bug": true
      },
      {
        "text": "s.display();",
        "bug": true
      },
      {
        "text": "void display() { }",
        "bug": true
      },
      {
        "text": "}",
        "bug": true
      }
    ],
    "clues": [
      {
        "text": "The code is scrambled. A class must encapsulate its methods.",
        "icon": "\ud83e\udde9"
      },
      {
        "text": "The object creation and method call must happen inside a method like 'main', not inside another class structure at the top level.",
        "icon": "\ud83c\udfd7\ufe0f"
      },
      {
        "text": "The method display() belongs inside the Student class.",
        "icon": "\ud83d\udce6"
      }
    ],
    "suspects": [
      {
        "name": "Syntax Error",
        "icon": "\ud83d\udeab",
        "correct": false
      },
      {
        "name": "Missing Blueprint (Class structure error)",
        "icon": "\ud83c\udfd7\ufe0f",
        "correct": true
      },
      {
        "name": "NullPointerException",
        "icon": "\ud83d\udc80",
        "correct": false
      },
      {
        "name": "Private method access",
        "icon": "\ud83d\udd12",
        "correct": false
      }
    ],
    "reasons": [
      {
        "text": "The student object needs to be created inside the class definition",
        "correct": false
      },
      {
        "text": "Object creation must happen in a method (like main) and the class needs its methods enclosed",
        "correct": true
      },
      {
        "text": "The display method is not public",
        "correct": false
      },
      {
        "text": "There are no variables",
        "correct": false
      }
    ],
    "fixes": [
      {
        "text": "class Student { void display(){} } // and in main: Student s = new Student(); s.display();",
        "correct": true
      },
      {
        "text": "class Student s = new Student();",
        "correct": false
      },
      {
        "text": "Student s = class Student { void display(){} };",
        "correct": false
      },
      {
        "text": "void display() { Student s = new Student(); } class Student {}",
        "correct": false
      }
    ],
    "detectorNote": "A class is the blueprint. An object is the house. You can't build the house without reading the blueprint first.",
    "criminal": "Missing Blueprint"
  },
  {
    "id": "U1-06",
    "title": "The Constructor Without Identity",
    "topic": "CONSTRUCTORS",
    "difficulty": "Rookie",
    "difficultyColor": "green",
    "xpReward": 100,
    "filename": "Student.java",
    "description": "Constructor argument mismatch.",
    "bannerSnippet": "Student s = <span class=\"text-crimson\">new Student()</span>;",
    "code": [
      {
        "text": "<span class=\"keyword\">class</span> <span class=\"class-name\">Student</span> {",
        "bug": false
      },
      {
        "text": "    <span class=\"class-name\">Student</span>(<span class=\"type\">String</span> name) {",
        "bug": false
      },
      {
        "text": "        <span class=\"class-name\">System</span>.<span class=\"variable\">out</span>.<span class=\"method\">println</span>(name);",
        "bug": false
      },
      {
        "text": "    }",
        "bug": false
      },
      {
        "text": "}",
        "bug": false
      },
      {
        "text": "",
        "bug": false
      },
      {
        "text": "<span class=\"class-name\">Student</span> s = <span class=\"keyword\">new</span> <span class=\"class-name\">Student</span>();",
        "bug": true
      }
    ],
    "clues": [
      {
        "text": "The Student class defines a constructor that expects a String.",
        "icon": "\ud83d\udd0d"
      },
      {
        "text": "When you write a custom constructor, Java removes the hidden default empty constructor.",
        "icon": "\ud83d\uddd1\ufe0f"
      },
      {
        "text": "The instantiation calls new Student(), passing NO arguments.",
        "icon": "\u26a0\ufe0f"
      }
    ],
    "suspects": [
      {
        "name": "Constructor mismatch",
        "icon": "\ud83c\udfd7\ufe0f",
        "correct": true
      },
      {
        "name": "Variable shadowing",
        "icon": "\ud83d\udc65",
        "correct": false
      },
      {
        "name": "NullPointerException",
        "icon": "\ud83d\udc80",
        "correct": false
      },
      {
        "name": "Runtime Polymorphism",
        "icon": "\ud83c\udfad",
        "correct": false
      }
    ],
    "reasons": [
      {
        "text": "The name string must be initialized before creating the object",
        "correct": false
      },
      {
        "text": "The instantiation is missing the required String argument",
        "correct": true
      },
      {
        "text": "The Student class lacks an abstract constructor",
        "correct": false
      },
      {
        "text": "Strings cannot be printed inside constructors",
        "correct": false
      }
    ],
    "fixes": [
      {
        "text": "Student s = new Student(\"Arun\");",
        "correct": true
      },
      {
        "text": "Student s = new Student(123);",
        "correct": false
      },
      {
        "text": "Student s = new Student;",
        "correct": false
      },
      {
        "text": "Student s = null;",
        "correct": false
      }
    ],
    "detectorNote": "Java gives you a free empty constructor ONLY if you don't build one yourself.",
    "criminal": "Constructor Mismatch"
  },
  {
    "id": "U1-07",
    "title": "The Missing Return",
    "topic": "METHODS",
    "difficulty": "Rookie",
    "difficultyColor": "green",
    "xpReward": 100,
    "filename": "MathCalc.java",
    "description": "A method promises a return value but fails to deliver.",
    "bannerSnippet": "static <span class=\"text-crimson\">int</span> add(int a, int b)",
    "code": [
      {
        "text": "<span class=\"keyword\">static int</span> <span class=\"method\">add</span>(<span class=\"type\">int</span> a, <span class=\"type\">int</span> b) {",
        "bug": false
      },
      {
        "text": "    <span class=\"type\">int</span> result = a + b;",
        "bug": true
      },
      {
        "text": "}",
        "bug": true
      }
    ],
    "clues": [
      {
        "text": "The method signature declares 'int' as the return type.",
        "icon": "\ud83d\udd0d"
      },
      {
        "text": "The method calculates the sum and stores it in 'result'.",
        "icon": "\ud83e\uddee"
      },
      {
        "text": "The method ends without sending anything back to the caller.",
        "icon": "\ud83d\udeab"
      }
    ],
    "suspects": [
      {
        "name": "Missing inheritance",
        "icon": "\ud83e\uddec",
        "correct": false
      },
      {
        "name": "Missing return statement",
        "icon": "\ud83d\udce4",
        "correct": true
      },
      {
        "name": "TypeMismatch",
        "icon": "\ud83c\udfad",
        "correct": false
      },
      {
        "name": "Syntax Error",
        "icon": "\u274c",
        "correct": false
      }
    ],
    "reasons": [
      {
        "text": "If a method return type is not void, it MUST use a return statement",
        "correct": true
      },
      {
        "text": "The result variable is private",
        "correct": false
      },
      {
        "text": "Static methods cannot return values",
        "correct": false
      },
      {
        "text": "You cannot declare local variables in static methods",
        "correct": false
      }
    ],
    "fixes": [
      {
        "text": "return result;",
        "correct": true
      },
      {
        "text": "return void;",
        "correct": false
      },
      {
        "text": "System.out.println(result);",
        "correct": false
      },
      {
        "text": "break result;",
        "correct": false
      }
    ],
    "detectorNote": "When you promise a type in the method signature, you must return it!",
    "criminal": "Missing Return"
  },
  {
    "id": "U1-08",
    "title": "The Private Vault",
    "topic": "ACCESS_SPECIFIERS",
    "difficulty": "Code Investigator",
    "difficultyColor": "amber",
    "xpReward": 150,
    "filename": "Account.java",
    "description": "Illegal private-member access.",
    "bannerSnippet": "System.out.println(<span class=\"text-crimson\">account.balance</span>);",
    "code": [
      {
        "text": "<span class=\"keyword\">class</span> <span class=\"class-name\">Account</span> {",
        "bug": false
      },
      {
        "text": "    <span class=\"keyword\">private</span> <span class=\"type\">double</span> balance = <span class=\"number\">5000</span>;",
        "bug": false
      },
      {
        "text": "}",
        "bug": false
      },
      {
        "text": "",
        "bug": false
      },
      {
        "text": "<span class=\"class-name\">Account</span> account = <span class=\"keyword\">new</span> <span class=\"class-name\">Account</span>();",
        "bug": false
      },
      {
        "text": "<span class=\"class-name\">System</span>.<span class=\"variable\">out</span>.<span class=\"method\">println</span>(account.balance);",
        "bug": true
      }
    ],
    "clues": [
      {
        "text": "The balance field belongs to Account.",
        "icon": "\ud83d\udd0d"
      },
      {
        "text": "The balance field is marked as private.",
        "icon": "\ud83d\udd12"
      },
      {
        "text": "The main method is trying to access balance directly from outside the class.",
        "icon": "\u26a0\ufe0f"
      }
    ],
    "suspects": [
      {
        "name": "Variable shadowing",
        "icon": "\ud83d\udc65",
        "correct": false
      },
      {
        "name": "NullPointerException",
        "icon": "\ud83d\udc80",
        "correct": false
      },
      {
        "name": "Encapsulation Violation",
        "icon": "\ud83d\udd12",
        "correct": true
      },
      {
        "name": "Constructor Mismatch",
        "icon": "\ud83c\udfd7\ufe0f",
        "correct": false
      }
    ],
    "reasons": [
      {
        "text": "Private fields are hidden and cannot be accessed outside the class directly",
        "correct": true
      },
      {
        "text": "Account object was not initialized properly",
        "correct": false
      },
      {
        "text": "System.out.println only accepts Strings",
        "correct": false
      },
      {
        "text": "Double values need to be cast to int",
        "correct": false
      }
    ],
    "fixes": [
      {
        "text": "// Inside Account: public double getBalance() { return balance; } // Usage: account.getBalance()",
        "correct": true
      },
      {
        "text": "System.out.println(account->balance);",
        "correct": false
      },
      {
        "text": "System.out.println(Account.balance);",
        "correct": false
      },
      {
        "text": "System.out.println(balance);",
        "correct": false
      }
    ],
    "detectorNote": "Private means \"keep out\". You need a public getter method to access it safely.",
    "criminal": "Encapsulation Violation"
  },
  {
    "id": "U1-09",
    "title": "The Shared Counter Mystery",
    "topic": "STATIC_MEMBERS",
    "difficulty": "Code Investigator",
    "difficultyColor": "amber",
    "xpReward": 150,
    "filename": "Student.java",
    "description": "Determine the output of a shared static counter.",
    "bannerSnippet": "<span class=\"text-crimson\">static int count = 0;</span>",
    "code": [
      {
        "text": "<span class=\"keyword\">class</span> <span class=\"class-name\">Student</span> {",
        "bug": false
      },
      {
        "text": "    <span class=\"keyword\">static int</span> count = <span class=\"number\">0</span>;",
        "bug": false
      },
      {
        "text": "    <span class=\"class-name\">Student</span>() {",
        "bug": false
      },
      {
        "text": "        count++;",
        "bug": false
      },
      {
        "text": "    }",
        "bug": false
      },
      {
        "text": "}",
        "bug": false
      },
      {
        "text": "<span class=\"class-name\">Student</span> s1 = <span class=\"keyword\">new</span> <span class=\"class-name\">Student</span>();",
        "bug": false
      },
      {
        "text": "<span class=\"class-name\">Student</span> s2 = <span class=\"keyword\">new</span> <span class=\"class-name\">Student</span>();",
        "bug": false
      },
      {
        "text": "<span class=\"class-name\">Student</span> s3 = <span class=\"keyword\">new</span> <span class=\"class-name\">Student</span>();",
        "bug": false
      },
      {
        "text": "<span class=\"class-name\">System</span>.<span class=\"variable\">out</span>.<span class=\"method\">println</span>(<span class=\"class-name\">Student</span>.count);",
        "bug": true
      }
    ],
    "clues": [
      {
        "text": "The count variable is declared as 'static'.",
        "icon": "\ud83c\udf1f"
      },
      {
        "text": "There are three objects created: s1, s2, and s3.",
        "icon": "\ud83d\udc64"
      },
      {
        "text": "Static variables are shared among all instances of the class.",
        "icon": "\ud83d\udcc8"
      }
    ],
    "suspects": [
      {
        "name": "3",
        "icon": "\ud83c\udfaf",
        "correct": true
      },
      {
        "name": "1",
        "icon": "\u274c",
        "correct": false
      },
      {
        "name": "0",
        "icon": "\u274c",
        "correct": false
      },
      {
        "name": "Compilation Error",
        "icon": "\ud83d\udeab",
        "correct": false
      }
    ],
    "reasons": [
      {
        "text": "Each object gets its own copy of count, so they are all 1",
        "correct": false
      },
      {
        "text": "Static means one shared copy. Every new Student increments the same counter.",
        "correct": true
      },
      {
        "text": "Static variables cannot be incremented",
        "correct": false
      },
      {
        "text": "Student.count is an invalid access method",
        "correct": false
      }
    ],
    "fixes": [
      {
        "text": "The output is 3.",
        "correct": true
      },
      {
        "text": "The output is 1.",
        "correct": false
      },
      {
        "text": "The output is 0.",
        "correct": false
      },
      {
        "text": "Throws exception.",
        "correct": false
      }
    ],
    "detectorNote": "Static means \"class-level\". All objects share the same memory location for it.",
    "criminal": "Static State Mutator"
  },
  {
    "id": "U1-10",
    "title": "The Undocumented Evidence",
    "topic": "JAVADOC",
    "difficulty": "Rookie",
    "difficultyColor": "green",
    "xpReward": 100,
    "filename": "Utils.java",
    "description": "Identify the correct JavaDoc format.",
    "bannerSnippet": "<span class=\"text-crimson\">// Calculates the total</span>",
    "code": [
      {
        "text": "<span class=\"comment\">// Calculates the total</span>",
        "bug": true
      },
      {
        "text": "<span class=\"keyword\">int</span> <span class=\"method\">calculateTotal</span>(<span class=\"type\">int</span> a, <span class=\"type\">int</span> b) {",
        "bug": false
      },
      {
        "text": "    <span class=\"keyword\">return</span> a + b;",
        "bug": false
      },
      {
        "text": "}",
        "bug": false
      }
    ],
    "clues": [
      {
        "text": "The current comment uses a double slash // which is a single-line comment.",
        "icon": "\ud83d\udcdd"
      },
      {
        "text": "JavaDoc comments must start with /** and end with */.",
        "icon": "\ud83d\udcdc"
      },
      {
        "text": "JavaDoc uses tags like @param and @return to generate API documentation.",
        "icon": "\ud83c\udff7\ufe0f"
      }
    ],
    "suspects": [
      {
        "name": "Incorrect Comment Format",
        "icon": "\u274c",
        "correct": true
      },
      {
        "name": "Missing Blueprint",
        "icon": "\ud83c\udfd7\ufe0f",
        "correct": false
      },
      {
        "name": "Syntax Error",
        "icon": "\ud83d\udeab",
        "correct": false
      },
      {
        "name": "TypeMismatch",
        "icon": "\ud83c\udfad",
        "correct": false
      }
    ],
    "reasons": [
      {
        "text": "JavaDoc requires a specific block format for the javadoc tool to recognize it",
        "correct": true
      },
      {
        "text": "Single line comments cause compilation errors in Java",
        "correct": false
      },
      {
        "text": "The method is missing a return statement",
        "correct": false
      },
      {
        "text": "The method should be static to have JavaDoc",
        "correct": false
      }
    ],
    "fixes": [
      {
        "text": "/**\n * Calculates the total.\n * @param a first value\n * @param b second value\n * @return calculated total\n */",
        "correct": true
      },
      {
        "text": "/* Calculates the total @param a @param b */",
        "correct": false
      },
      {
        "text": "/// Calculates the total\n/// @param a\n/// @param b",
        "correct": false
      },
      {
        "text": "<!-- Calculates the total -->",
        "correct": false
      }
    ],
    "detectorNote": "JavaDoc is what creates those nice web pages explaining what methods do. It needs the /** format.",
    "criminal": "Incorrect Comment Format"
  }
]);
