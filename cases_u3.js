CASES.push(...[
  {
    "id": "U3-01",
    "title": "The Division Murder",
    "topic": "EXCEPTIONS_THREADS",
    "difficulty": "Rookie",
    "difficultyColor": "green",
    "xpReward": 100,
    "filename": "Calculator.java",
    "description": "Exception Basics: Division by zero.",
    "bannerSnippet": "System.out.println(<span class=\"text-crimson\">a / b</span>);",
    "code": [
      {
        "text": "<span class=\"type\">int</span> a = <span class=\"number\">100</span>;",
        "bug": false
      },
      {
        "text": "<span class=\"type\">int</span> b = <span class=\"number\">0</span>;",
        "bug": false
      },
      {
        "text": "",
        "bug": false
      },
      {
        "text": "<span class=\"class-name\">System</span>.<span class=\"variable\">out</span>.<span class=\"method\">println</span>(a / b);",
        "bug": true
      }
    ],
    "clues": [
      {
        "text": "The variable 'a' is 100.",
        "icon": "\ud83d\udd0d"
      },
      {
        "text": "The variable 'b' is 0.",
        "icon": "0\ufe0f\u20e3"
      },
      {
        "text": "The math operation is division (/).",
        "icon": "\u2797"
      }
    ],
    "suspects": [
      {
        "name": "NullPointerException",
        "icon": "\ud83d\udc80",
        "correct": false
      },
      {
        "name": "ArithmeticException",
        "icon": "\u2797",
        "correct": true
      },
      {
        "name": "ClassCastException",
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
        "text": "Variables a and b are not initialized",
        "correct": false
      },
      {
        "text": "Integer division by zero is mathematically undefined and throws an ArithmeticException",
        "correct": true
      },
      {
        "text": "The division operator is incorrectly spelled",
        "correct": false
      },
      {
        "text": "0 is not an integer",
        "correct": false
      }
    ],
    "fixes": [
      {
        "text": "if (b != 0) System.out.println(a / b); else System.out.println(\"Cannot divide by 0\");",
        "correct": true
      },
      {
        "text": "System.out.println(a % b);",
        "correct": false
      },
      {
        "text": "System.out.println(b / a);",
        "correct": false
      },
      {
        "text": "System.out.println(a * b);",
        "correct": false
      }
    ],
    "detectorNote": "What happens when you divide by zero in mathematics?",
    "criminal": "ArithmeticException"
  },
  {
    "id": "U3-02",
    "title": "The Wrong Catch",
    "topic": "EXCEPTIONS_THREADS",
    "difficulty": "Code Investigator",
    "difficultyColor": "amber",
    "xpReward": 150,
    "filename": "Investigation.java",
    "description": "Catch block ordering error.",
    "bannerSnippet": "} <span class=\"text-crimson\">catch (Exception e)</span> {",
    "code": [
      {
        "text": "<span class=\"keyword\">try</span> {",
        "bug": false
      },
      {
        "text": "    <span class=\"comment\">// suspicious operation</span>",
        "bug": false
      },
      {
        "text": "}",
        "bug": false
      },
      {
        "text": "<span class=\"keyword\">catch</span> (<span class=\"class-name\">Exception</span> e) {",
        "bug": true
      },
      {
        "text": "}",
        "bug": true
      },
      {
        "text": "<span class=\"keyword\">catch</span> (<span class=\"class-name\">ArithmeticException</span> e) {",
        "bug": true
      },
      {
        "text": "}",
        "bug": true
      }
    ],
    "clues": [
      {
        "text": "There are multiple catch blocks for a single try block.",
        "icon": "\ud83d\udd0d"
      },
      {
        "text": "Exception is the parent class of all exceptions, including ArithmeticException.",
        "icon": "\ud83e\uddec"
      },
      {
        "text": "Java catches exceptions from top to bottom.",
        "icon": "\u2b07\ufe0f"
      }
    ],
    "suspects": [
      {
        "name": "Catch Ordering",
        "icon": "\ud83d\udd00",
        "correct": true
      },
      {
        "name": "ArithmeticException",
        "icon": "\u2797",
        "correct": false
      },
      {
        "name": "Missing Return",
        "icon": "\ud83d\udce4",
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
        "text": "More specific exceptions must appear BEFORE broader (parent) exceptions",
        "correct": true
      },
      {
        "text": "You can only have one catch block per try block",
        "correct": false
      },
      {
        "text": "ArithmeticException is not a valid Java class",
        "correct": false
      },
      {
        "text": "The try block is empty",
        "correct": false
      }
    ],
    "fixes": [
      {
        "text": "catch(ArithmeticException e){} catch(Exception e){}",
        "correct": true
      },
      {
        "text": "catch(Exception e, ArithmeticException a){}",
        "correct": false
      },
      {
        "text": "try{} catch(Exception e){} try{} catch(ArithmeticException e){}",
        "correct": false
      },
      {
        "text": "catch(ArithmeticException e | Exception a){}",
        "correct": false
      }
    ],
    "detectorNote": "Always cast a small net before you cast the big net. Put subclasses first!",
    "criminal": "Unreachable Catch Block"
  },
  {
    "id": "U3-03",
    "title": "The Nested Trap",
    "topic": "EXCEPTIONS_THREADS",
    "difficulty": "Code Investigator",
    "difficultyColor": "amber",
    "xpReward": 150,
    "filename": "Lab.java",
    "description": "Determine which catch block handles a nested exception.",
    "bannerSnippet": "int[] a = {1}; <span class=\"text-crimson\">a[5] = 10;</span>",
    "code": [
      {
        "text": "<span class=\"keyword\">try</span> {",
        "bug": false
      },
      {
        "text": "    <span class=\"keyword\">try</span> {",
        "bug": false
      },
      {
        "text": "        <span class=\"type\">int</span>[] a = {<span class=\"number\">1</span>};",
        "bug": false
      },
      {
        "text": "        a[<span class=\"number\">5</span>] = <span class=\"number\">10</span>;",
        "bug": true
      },
      {
        "text": "    } <span class=\"keyword\">catch</span> (<span class=\"class-name\">ArithmeticException</span> e) {",
        "bug": false
      },
      {
        "text": "        <span class=\"class-name\">System</span>.<span class=\"variable\">out</span>.<span class=\"method\">println</span>(<span class=\"string\">\"Inner\"</span>);",
        "bug": false
      },
      {
        "text": "    }",
        "bug": false
      },
      {
        "text": "} <span class=\"keyword\">catch</span> (<span class=\"class-name\">ArrayIndexOutOfBoundsException</span> e) {",
        "bug": false
      },
      {
        "text": "    <span class=\"class-name\">System</span>.<span class=\"variable\">out</span>.<span class=\"method\">println</span>(<span class=\"string\">\"Outer\"</span>);",
        "bug": false
      },
      {
        "text": "}",
        "bug": false
      }
    ],
    "clues": [
      {
        "text": "The error occurs at a[5] = 10.",
        "icon": "\ud83d\udd0d"
      },
      {
        "text": "The array only has one element (index 0). Accessing index 5 throws ArrayIndexOutOfBoundsException.",
        "icon": "\ud83d\udcca"
      },
      {
        "text": "The inner catch block only looks for ArithmeticException.",
        "icon": "\u2797"
      }
    ],
    "suspects": [
      {
        "name": "Inner Catch",
        "icon": "\ud83d\udce5",
        "correct": false
      },
      {
        "name": "Outer Catch",
        "icon": "\ud83d\udce4",
        "correct": true
      },
      {
        "name": "Uncaught Exception",
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
        "text": "The inner block catches everything",
        "correct": false
      },
      {
        "text": "The inner catch block doesn\\'t match the exception, so the exception propagates to the outer catch block",
        "correct": true
      },
      {
        "text": "Nested try-catch blocks are illegal in Java",
        "correct": false
      },
      {
        "text": "ArrayIndexOutOfBoundsException is not an exception",
        "correct": false
      }
    ],
    "fixes": [
      {
        "text": "Output is: Outer",
        "correct": true
      },
      {
        "text": "Output is: Inner",
        "correct": false
      },
      {
        "text": "Program crashes",
        "correct": false
      },
      {
        "text": "Compile Error",
        "correct": false
      }
    ],
    "detectorNote": "If the inner trap doesn\\'t fit the crime, the criminal escapes to the outer trap.",
    "criminal": "Nested Exception Propagation"
  },
  {
    "id": "U3-04",
    "title": "The Null Assassin",
    "topic": "EXCEPTIONS_THREADS",
    "difficulty": "Rookie",
    "difficultyColor": "green",
    "xpReward": 100,
    "filename": "Witness.java",
    "description": "Built-in Exceptions: Using a null reference.",
    "bannerSnippet": "<span class=\"text-crimson\">witness.length()</span>;",
    "code": [
      {
        "text": "<span class=\"type\">String</span> witness = <span class=\"keyword\">null</span>;",
        "bug": false
      },
      {
        "text": "",
        "bug": false
      },
      {
        "text": "<span class=\"class-name\">System</span>.<span class=\"variable\">out</span>.<span class=\"method\">println</span>(witness.<span class=\"method\">length</span>());",
        "bug": true
      }
    ],
    "clues": [
      {
        "text": "The 'witness' string is explicitly set to null.",
        "icon": "\ud83d\udd0d"
      },
      {
        "text": "Null means 'no object exists'.",
        "icon": "\ud83d\udd73\ufe0f"
      },
      {
        "text": "The code tries to call the length() method on an object that doesn't exist.",
        "icon": "\ud83d\udc80"
      }
    ],
    "suspects": [
      {
        "name": "StringIndexOutOfBoundsException",
        "icon": "\ud83d\udcca",
        "correct": false
      },
      {
        "name": "NullPointerException",
        "icon": "\ud83d\udc80",
        "correct": true
      },
      {
        "name": "ArithmeticException",
        "icon": "\u2797",
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
        "text": "You cannot call methods on a null reference",
        "correct": true
      },
      {
        "text": "Strings do not have a length() method",
        "correct": false
      },
      {
        "text": "Length returns 0 for null strings",
        "correct": false
      },
      {
        "text": "Null is not a valid Java keyword",
        "correct": false
      }
    ],
    "fixes": [
      {
        "text": "if (witness != null) { System.out.println(witness.length()); }",
        "correct": true
      },
      {
        "text": "System.out.println(witness);",
        "correct": false
      },
      {
        "text": "System.out.println(witness[0]);",
        "correct": false
      },
      {
        "text": "System.out.println(null);",
        "correct": false
      }
    ],
    "detectorNote": "Always verify your witness exists before interrogating them!",
    "criminal": "NullPointerException"
  },
  {
    "id": "U3-05",
    "title": "The Unauthorized Age",
    "topic": "EXCEPTIONS_THREADS",
    "difficulty": "Senior Investigator",
    "difficultyColor": "crimson",
    "xpReward": 200,
    "filename": "Auth.java",
    "description": "User-Defined Exception.",
    "bannerSnippet": "<span class=\"text-crimson\">throw new InvalidAgeException(\"Too young\");</span>",
    "code": [
      {
        "text": "<span class=\"keyword\">class</span> <span class=\"class-name\">InvalidAgeException</span> <span class=\"keyword\">extends</span> <span class=\"class-name\">Exception</span> {",
        "bug": false
      },
      {
        "text": "    <span class=\"keyword\">public</span> <span class=\"class-name\">InvalidAgeException</span>(<span class=\"type\">String</span> msg) { <span class=\"keyword\">super</span>(msg); }",
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
        "text": "<span class=\"keyword\">void</span> <span class=\"method\">checkAge</span>(<span class=\"type\">int</span> age) {",
        "bug": true
      },
      {
        "text": "    <span class=\"keyword\">if</span> (age < <span class=\"number\">18</span>) {",
        "bug": false
      },
      {
        "text": "        <span class=\"keyword\">throw new</span> <span class=\"class-name\">InvalidAgeException</span>(<span class=\"string\">\"Too young\"</span>);",
        "bug": true
      },
      {
        "text": "    }",
        "bug": false
      },
      {
        "text": "}",
        "bug": false
      }
    ],
    "clues": [
      {
        "text": "InvalidAgeException extends Exception, meaning it is a Checked Exception.",
        "icon": "\ud83d\udd0d"
      },
      {
        "text": "The method checkAge throws this checked exception.",
        "icon": "\ud83d\udce4"
      },
      {
        "text": "Methods that throw checked exceptions must declare them in their signature using 'throws'.",
        "icon": "\ud83d\udcdc"
      }
    ],
    "suspects": [
      {
        "name": "Missing 'throws' declaration",
        "icon": "\ud83d\udcdc",
        "correct": true
      },
      {
        "name": "Invalid throw syntax",
        "icon": "\u274c",
        "correct": false
      },
      {
        "name": "Missing inheritance",
        "icon": "\ud83e\uddec",
        "correct": false
      },
      {
        "name": "Exception subclassing error",
        "icon": "\ud83d\udeab",
        "correct": false
      }
    ],
    "reasons": [
      {
        "text": "Custom exceptions must extend RuntimeException to avoid throws",
        "correct": false
      },
      {
        "text": "Checked exceptions must be explicitly declared in the method signature",
        "correct": true
      },
      {
        "text": "You cannot throw exceptions from inside an if-statement",
        "correct": false
      },
      {
        "text": "InvalidAgeException does not exist",
        "correct": false
      }
    ],
    "fixes": [
      {
        "text": "void checkAge(int age) throws InvalidAgeException { ... }",
        "correct": true
      },
      {
        "text": "void checkAge(int age) catch InvalidAgeException { ... }",
        "correct": false
      },
      {
        "text": "void checkAge(int age) throw Exception { ... }",
        "correct": false
      },
      {
        "text": "void checkAge(int age) { ... }",
        "correct": false
      }
    ],
    "detectorNote": "If you throw a checked bomb, you must put a warning sign (throws) on the door!",
    "criminal": "Undeclared Checked Exception"
  },
  {
    "id": "U3-06",
    "title": "The Missing Thread",
    "topic": "EXCEPTIONS_THREADS",
    "difficulty": "Code Investigator",
    "difficultyColor": "amber",
    "xpReward": 150,
    "filename": "Investigation.java",
    "description": "Thread creation and start.",
    "bannerSnippet": "Investigation i = new Investigation(); <span class=\"text-crimson\">i.run();</span>",
    "code": [
      {
        "text": "<span class=\"keyword\">class</span> <span class=\"class-name\">Investigation</span> <span class=\"keyword\">extends</span> <span class=\"class-name\">Thread</span> {",
        "bug": false
      },
      {
        "text": "    <span class=\"keyword\">public void</span> <span class=\"method\">run</span>() {",
        "bug": false
      },
      {
        "text": "        <span class=\"class-name\">System</span>.<span class=\"variable\">out</span>.<span class=\"method\">println</span>(<span class=\"string\">\"Investigating\"</span>);",
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
        "text": "<span class=\"class-name\">Investigation</span> i = <span class=\"keyword\">new</span> <span class=\"class-name\">Investigation</span>();",
        "bug": false
      },
      {
        "text": "i.<span class=\"method\">run</span>();",
        "bug": true
      }
    ],
    "clues": [
      {
        "text": "The class extends Thread, which is correct for creating a thread.",
        "icon": "\ud83d\udd0d"
      },
      {
        "text": "Calling run() directly just executes the method in the CURRENT thread like a normal method call.",
        "icon": "\ud83d\udcde"
      },
      {
        "text": "To actually spawn a NEW thread, a different method must be called.",
        "icon": "\ud83c\udf1f"
      }
    ],
    "suspects": [
      {
        "name": "Thread not started correctly",
        "icon": "\ud83c\udf1f",
        "correct": true
      },
      {
        "name": "Missing inheritance",
        "icon": "\ud83e\uddec",
        "correct": false
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
        "text": "You must implement Runnable instead of extending Thread",
        "correct": false
      },
      {
        "text": "Calling run() does not spawn a new thread; you must call start()",
        "correct": true
      },
      {
        "text": "The thread object 'i' is null",
        "correct": false
      },
      {
        "text": "The run() method must be static",
        "correct": false
      }
    ],
    "fixes": [
      {
        "text": "i.start();",
        "correct": true
      },
      {
        "text": "i.execute();",
        "correct": false
      },
      {
        "text": "i.begin();",
        "correct": false
      },
      {
        "text": "i.spawn();",
        "correct": false
      }
    ],
    "detectorNote": "Running is just running. Starting is what tells Java to spin up a whole new timeline (thread)!",
    "criminal": "Incorrect Thread Invocation"
  },
  {
    "id": "U3-07",
    "title": "The Race Condition Heist",
    "topic": "EXCEPTIONS_THREADS",
    "difficulty": "Senior Investigator",
    "difficultyColor": "crimson",
    "xpReward": 250,
    "filename": "Bank.java",
    "description": "Multiple threads modifying shared state.",
    "bannerSnippet": "<span class=\"text-crimson\">balance++;</span> // Accessed by 10 threads",
    "code": [
      {
        "text": "<span class=\"keyword\">class</span> <span class=\"class-name\">Bank</span> {",
        "bug": false
      },
      {
        "text": "    <span class=\"keyword\">int</span> balance = <span class=\"number\">0</span>;",
        "bug": false
      },
      {
        "text": "",
        "bug": false
      },
      {
        "text": "    <span class=\"keyword\">void</span> <span class=\"method\">deposit</span>() {",
        "bug": false
      },
      {
        "text": "        balance++;",
        "bug": true
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
        "text": "<span class=\"comment\">// Assume 10 threads call deposit() 100 times each simultaneously.</span>",
        "bug": false
      },
      {
        "text": "<span class=\"comment\">// Expected total: 1000. Actual total: 942.</span>",
        "bug": true
      }
    ],
    "clues": [
      {
        "text": "The expected total is 1000, but the actual total is unpredictable (like 942).",
        "icon": "\ud83d\udd0d"
      },
      {
        "text": "balance++ is not a single atomic operation; it is a read, increment, and write.",
        "icon": "\u23f1\ufe0f"
      },
      {
        "text": "Multiple threads are reading the same old balance simultaneously and writing back identical incremented values.",
        "icon": "\ud83d\udc65"
      }
    ],
    "suspects": [
      {
        "name": "Race Condition",
        "icon": "\ud83c\udfc3",
        "correct": true
      },
      {
        "name": "ArithmeticException",
        "icon": "\u2797",
        "correct": false
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
      }
    ],
    "reasons": [
      {
        "text": "Multiple threads are overwriting each other's updates because the operation is not synchronized",
        "correct": true
      },
      {
        "text": "The loop condition is incorrect",
        "correct": false
      },
      {
        "text": "The balance variable cannot exceed 942",
        "correct": false
      },
      {
        "text": "Java randomly drops thread operations",
        "correct": false
      }
    ],
    "fixes": [
      {
        "text": "The criminal is a Race Condition. Synchronization is needed.",
        "correct": true
      },
      {
        "text": "The criminal is a syntax error.",
        "correct": false
      },
      {
        "text": "The criminal is a math error.",
        "correct": false
      },
      {
        "text": "The criminal is a loop error.",
        "correct": false
      }
    ],
    "detectorNote": "If two detectives try to file paperwork in the exact same folder at the same millisecond, one file gets lost!",
    "criminal": "Race Condition"
  },
  {
    "id": "U3-08",
    "title": "The Locked Evidence Room",
    "topic": "EXCEPTIONS_THREADS",
    "difficulty": "Senior Investigator",
    "difficultyColor": "crimson",
    "xpReward": 250,
    "filename": "Bank.java",
    "description": "Synchronization solution to a race condition.",
    "bannerSnippet": "<span class=\"text-crimson\">void deposit()</span> { balance++; }",
    "code": [
      {
        "text": "<span class=\"keyword\">class</span> <span class=\"class-name\">Bank</span> {",
        "bug": false
      },
      {
        "text": "    <span class=\"keyword\">int</span> balance = <span class=\"number\">0</span>;",
        "bug": false
      },
      {
        "text": "",
        "bug": false
      },
      {
        "text": "    <span class=\"keyword\">void</span> <span class=\"method\">deposit</span>() {",
        "bug": true
      },
      {
        "text": "        balance++;",
        "bug": false
      },
      {
        "text": "    }",
        "bug": false
      },
      {
        "text": "}",
        "bug": false
      }
    ],
    "clues": [
      {
        "text": "This is the same crime scene from The Race Condition Heist.",
        "icon": "\ud83d\udd0d"
      },
      {
        "text": "We need to ensure only ONE thread can execute the deposit() method at a time.",
        "icon": "\ud83d\udd12"
      },
      {
        "text": "Java provides a specific keyword to lock a method to a single thread.",
        "icon": "\ud83d\udd11"
      }
    ],
    "suspects": [
      {
        "name": "Missing Synchronization",
        "icon": "\ud83d\udd12",
        "correct": true
      },
      {
        "name": "Missing Volatile",
        "icon": "\u26a1",
        "correct": false
      },
      {
        "name": "TypeMismatch",
        "icon": "\ud83c\udfad",
        "correct": false
      },
      {
        "name": "Missing Thread.sleep()",
        "icon": "\ud83d\udca4",
        "correct": false
      }
    ],
    "reasons": [
      {
        "text": "The method must be marked synchronized so only one thread can acquire the lock",
        "correct": true
      },
      {
        "text": "The variable balance must be declared final",
        "correct": false
      },
      {
        "text": "The thread needs to sleep before incrementing",
        "correct": false
      },
      {
        "text": "The method must be static",
        "correct": false
      }
    ],
    "fixes": [
      {
        "text": "synchronized void deposit() { balance++; }",
        "correct": true
      },
      {
        "text": "void deposit(synchronized) { balance++; }",
        "correct": false
      },
      {
        "text": "volatile void deposit() { balance++; }",
        "correct": false
      },
      {
        "text": "static void deposit() { balance++; }",
        "correct": false
      }
    ],
    "detectorNote": "Synchronized is the lock on the evidence room door. Only one detective inside at a time!",
    "criminal": "Missing Synchronization"
  },
  {
    "id": "U3-09",
    "title": "The Waiting Witness",
    "topic": "EXCEPTIONS_THREADS",
    "difficulty": "Master Detective",
    "difficultyColor": "crimson",
    "xpReward": 300,
    "filename": "Interrogation.java",
    "description": "Inter-thread communication using wait() and notify().",
    "bannerSnippet": "Thread 1: <span class=\"text-cyan\">wait();</span> Thread 2: <span class=\"text-crimson\">_______;</span>",
    "code": [
      {
        "text": "<span class=\"keyword\">class</span> <span class=\"class-name\">Room</span> {",
        "bug": false
      },
      {
        "text": "    <span class=\"keyword\">synchronized void</span> <span class=\"method\">waitForAnswer</span>() <span class=\"keyword\">throws</span> <span class=\"class-name\">InterruptedException</span> {",
        "bug": false
      },
      {
        "text": "        <span class=\"method\">wait</span>();",
        "bug": false
      },
      {
        "text": "    }",
        "bug": false
      },
      {
        "text": "",
        "bug": false
      },
      {
        "text": "    <span class=\"keyword\">synchronized void</span> <span class=\"method\">provideAnswer</span>() {",
        "bug": false
      },
      {
        "text": "        <span class=\"keyword\">________</span>;",
        "bug": true
      },
      {
        "text": "    }",
        "bug": false
      },
      {
        "text": "}",
        "bug": false
      }
    ],
    "clues": [
      {
        "text": "Thread 1 enters waitForAnswer() and calls wait(). It goes to sleep.",
        "icon": "\ud83d\udca4"
      },
      {
        "text": "Thread 2 enters provideAnswer() when it has the information.",
        "icon": "\ud83d\udcdd"
      },
      {
        "text": "Thread 2 needs a way to wake up Thread 1.",
        "icon": "\ud83d\udd14"
      }
    ],
    "suspects": [
      {
        "name": "Missing notify()",
        "icon": "\ud83d\udd14",
        "correct": true
      },
      {
        "name": "Missing start()",
        "icon": "\ud83c\udf1f",
        "correct": false
      },
      {
        "name": "Missing wake()",
        "icon": "\u23f0",
        "correct": false
      },
      {
        "name": "Missing resume()",
        "icon": "\u25b6\ufe0f",
        "correct": false
      }
    ],
    "reasons": [
      {
        "text": "The wait() method pauses a thread until another thread calls notify() or notifyAll() on the same object",
        "correct": true
      },
      {
        "text": "The thread needs to be restarted with start()",
        "correct": false
      },
      {
        "text": "The wake() method wakes up sleeping threads",
        "correct": false
      },
      {
        "text": "Thread.resume() is the correct safe method",
        "correct": false
      }
    ],
    "fixes": [
      {
        "text": "notify();",
        "correct": true
      },
      {
        "text": "wake();",
        "correct": false
      },
      {
        "text": "start();",
        "correct": false
      },
      {
        "text": "resume();",
        "correct": false
      }
    ],
    "detectorNote": "In Java, threads wait() to sleep, and notify() to ring the alarm for others.",
    "criminal": "Thread Deadlock / Sleeping"
  },
  {
    "id": "U3-10",
    "title": "The Boxed Identity",
    "topic": "EXCEPTIONS_THREADS",
    "difficulty": "Code Investigator",
    "difficultyColor": "amber",
    "xpReward": 150,
    "filename": "Evidence.java",
    "description": "Wrappers and Autoboxing.",
    "bannerSnippet": "<span class=\"text-cyan\">Integer evidence = 100;</span>",
    "code": [
      {
        "text": "<span class=\"class-name\">Integer</span> evidence = <span class=\"number\">100</span>;",
        "bug": false
      },
      {
        "text": "<span class=\"type\">int</span> result = evidence;",
        "bug": false
      }
    ],
    "clues": [
      {
        "text": "'Integer' is an object wrapper class. 'int' is a primitive type.",
        "icon": "\ud83d\udd0d"
      },
      {
        "text": "We are assigning a primitive (100) directly to an Object (evidence).",
        "icon": "\ud83d\udce6"
      },
      {
        "text": "We are assigning an Object (evidence) directly to a primitive (result).",
        "icon": "\ud83d\udce4"
      }
    ],
    "suspects": [
      {
        "name": "Autoboxing and Unboxing",
        "icon": "\ud83d\udce6",
        "correct": true
      },
      {
        "name": "Compilation Error",
        "icon": "\u274c",
        "correct": false
      },
      {
        "name": "ClassCastException",
        "icon": "\ud83c\udfad",
        "correct": false
      },
      {
        "name": "TypeMismatch",
        "icon": "\ud83d\udeab",
        "correct": false
      }
    ],
    "reasons": [
      {
        "text": "Java automatically converts between primitives and their wrapper classes",
        "correct": true
      },
      {
        "text": "You cannot mix objects and primitives without explicit casts",
        "correct": false
      },
      {
        "text": "The Integer class does not support assignment from ints",
        "correct": false
      },
      {
        "text": "Variables must be the exact same type",
        "correct": false
      }
    ],
    "fixes": [
      {
        "text": "The code is correct. It uses Autoboxing and Unboxing.",
        "correct": true
      },
      {
        "text": "Integer evidence = new Integer(100);",
        "correct": false
      },
      {
        "text": "int result = (int) evidence;",
        "correct": false
      },
      {
        "text": "Compile Error.",
        "correct": false
      }
    ],
    "detectorNote": "Java is smart. It \"boxes\" a primitive into an Object when needed, and \"unboxes\" it back automatically.",
    "criminal": "Autoboxing Concept"
  }
]);
