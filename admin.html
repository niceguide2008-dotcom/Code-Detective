/* Object Oriented Programming Using Java — Unit I investigation pack.
   Kept as data so the existing Code Detective engine can render it without a UI redesign. */
(function () {
  const cases = [
    ['JOP-U1-01','The Blueprint Heist','Overview of Object Oriented Programming','Senior Investigator',250,'12 min','Object Hunter','A dispatch system lost the blueprint that connects evidence to the detectives who process it.','class Evidence { String label; }','Class and object roles were confused.','A class is a blueprint; an object is one usable instance.','new Evidence()'],
    ['JOP-U1-02','The Paradigm Switch','Object Oriented Programming Paradigms','Senior Investigator',260,'13 min','Paradigm Pathfinder','A legacy records room mixes procedural instructions with object responsibilities, and cases are being filed by the wrong clerk.','class CaseFile { void file() { } }','Related state and behavior should travel together in an object.','OOP organizes programs around collaborating objects.','Move filing behavior into CaseFile'],
    ['JOP-U1-03','The Four-Seal Breach','Features of OOP','Senior Investigator',275,'14 min','Encapsulation Guardian','A suspect altered protected evidence because every field in the archive was openly exposed.','class Vault { public String code; }','The vault exposes state that should be protected.','Encapsulation protects data behind controlled methods.','private String code;'],
    ['JOP-U1-04','The Java Jurisdiction','Overview of Java','Senior Investigator',250,'12 min','Java Investigator','A cross-platform case file works at one station but an officer claims Java source runs directly on every machine.','public class Brief { public static void main(String[] args) {} }','Java source is compiled to bytecode, then the JVM executes it.','Java uses the JVM to support platform independence.','Compile with javac, run with java'],
    ['JOP-U1-05','The Buzzword Alibi','Java Buzzwords','Senior Investigator',270,'13 min','Platform Tracker','A vendor promises “write once, run anywhere” but deleted the component that makes that promise credible.','// bytecode runs on a JVM','The JVM is the runtime bridge between bytecode and an operating system.','Java is portable, object-oriented, robust and secure.','Install a compatible JVM'],
    ['JOP-U1-06','The Evidence Locker Types','Data Types, Variables and Arrays','Senior Investigator',300,'15 min','Type Forensic Analyst','The property desk stores a badge number in the wrong kind of container, corrupting an entire evidence list.','int[] badgeIds = new int[3];\nbadgeIds[3] = 404;','Arrays have fixed length and valid indexes start at zero.','Variables have a declared type; arrays store indexed values of one type.','badgeIds[2] = 404;'],
    ['JOP-U1-07','The Operator Forgery','Operators','Senior Investigator',280,'14 min','Operator Examiner','A reward ledger reports the wrong total after a clerk used an operator that looked nearly identical to an assignment.','int points = 40;\npoints += 10 * 2;','Operator precedence evaluates multiplication before addition assignment.','Operators perform arithmetic, comparison, logical and assignment work.','// points is 60'],
    ['JOP-U1-08','The Missing Exit Route','Control Statements','Senior Investigator',300,'15 min','Control Flow Detective','An alert loop never stops searching because its exit condition was placed outside the patrol route.','int i = 0;\nwhile (i < 3) { System.out.println(i); }','The loop variable never changes, so the condition never becomes false.','Control statements decide which code runs and how often.','i++;'],
    ['JOP-U1-09','The Witness Profile','Classes and Objects','Master Detective',500,'18 min','Class Architect','A witness profile cannot remember its own name because field and object responsibilities were never established.','class Witness { String name; void introduce() { System.out.println(name); } }','An object stores state in fields and exposes behavior through methods.','Each object is an instance with its own state.','Witness w = new Witness(); w.name = "Mira";'],
    ['JOP-U1-10','The Unnamed Arrival','Constructors','Senior Investigator',320,'16 min','Constructor Analyst','Every new detective arrives without an identity because the intake procedure was never invoked correctly.','class Detective { Detective(String name) { } }\nDetective d = new Detective();','A parameterized constructor must be called with matching arguments.','Constructors initialize objects when new creates them.','new Detective("Asha")'],
    ['JOP-U1-11','The Silent Informant','Methods','Master Detective',500,'18 min','Method Investigator','An informant calculates a lead but never returns it to headquarters.','int scoreLead(int clues) { int score = clues * 10; }','A non-void method must return a value on every valid path.','Methods package a named task and may receive parameters or return values.','return score;'],
    ['JOP-U1-12','The Restricted Archive','Access Specifiers','Senior Investigator',300,'15 min','Access Control Detective','A field officer tries to read a sealed archive field directly from outside its class.','class Archive { private String seal = "RED"; }\n// archive.seal','private members are available only inside their declaring class.','Access specifiers control visibility: private, default, protected and public.','public String getSeal() { return seal; }'],
    ['JOP-U1-13','The Shared Ledger','Static Members','Chief Detective',800,'22 min','Static Specialist','The headquarters counter resets for every detective, hiding the real number of active investigations.','class CaseCounter { int openCases = 0; }','A value shared by every instance belongs to the class, not an individual object.','Static members belong to the class and can be used without an object.','static int openCases = 0;']
  ];
  const questionTypes = ['Multiple Choice','Fill in the Blank','Drag and Drop','Arrange the Steps','Identify the Error','Predict Output','Complete the Java Code','Match the Following'];
  const icons = ['🔎','🧩','💾','🧠','⚖️','🧪'];
  // Each core decision is deliberately built from plausible Java misconceptions.
  // `at` is zero-based and is varied across all three investigation stages.
  const challenges = {
    'JOP-U1-01': {
      suspect: { prompt: 'Which statement correctly identifies the missing blueprint relationship?', correct: '`Evidence` is a class; each `new Evidence()` expression produces a distinct object.', distractors: ['`Evidence` is an object because it contains a field.', '`String label` is the blueprint for every Evidence record.', 'A class and an object are interchangeable names in Java.'], at: 1 },
      reason: { prompt: 'Why does that distinction matter when evidence must be kept separately?', correct: 'Objects carry independent runtime state while a class describes the common structure and behavior.', distractors: ['All fields in a class are automatically shared by every object.', 'Only static fields can be stored in an object.', 'The JVM copies a class definition whenever a field changes.'], at: 2 },
      fix: { prompt: 'Which reconstruction gives two detectives two independent evidence records?', correct: 'Evidence first = new Evidence(); Evidence second = new Evidence();', distractors: ['class first = new Evidence(); class second = new Evidence();', 'Evidence first, second = Evidence;', 'new Evidence(first, second);'], at: 3 }
    },
    'JOP-U1-02': {
      suspect: { prompt: 'Which design decision best repairs the mixed-up procedural record room?', correct: 'Give each `CaseFile` its own data and filing behavior, then let objects collaborate.', distractors: ['Place every case field in one global static array.', 'Use only free-standing methods because classes cannot contain behavior.', 'Create one `CaseFile` class but keep all case data in unrelated variables.'], at: 3 },
      reason: { prompt: 'What OOP principle is being applied?', correct: 'Cohesion: state and the operations that use it are grouped in the same meaningful object.', distractors: ['Inheritance: every method must extend another method.', 'Compilation: methods become objects at runtime.', 'Overloading: fields are selected by parameter type.'], at: 1 },
      fix: { prompt: 'Which code direction preserves responsibility inside the model?', correct: 'class CaseFile { String id; void file() { /* use this.id */ } }', distractors: ['static String id; static void fileAllCases() { }', 'void file(CaseFile c) { String id = ""; } // no CaseFile state', 'CaseFile = void file();'], at: 2 }
    },
    'JOP-U1-03': {
      suspect: { prompt: 'Which exposure caused the vault breach?', correct: 'The sensitive `code` field is public, so any caller can overwrite it directly.', distractors: ['The field has no constructor parameter.', 'The class has too few methods.', 'A String field cannot be stored in a class.'], at: 2 },
      reason: { prompt: 'Which OOP feature is violated by direct mutable access?', correct: 'Encapsulation, because the class cannot enforce validation before its internal state changes.', distractors: ['Polymorphism, because the field has one type.', 'Abstraction, because every class needs an interface.', 'Inheritance, because `Vault` has no parent class.'], at: 3 },
      fix: { prompt: 'Which repair allows controlled access without exposing the vault code?', correct: 'private String code; public boolean matches(String attempt) { return code.equals(attempt); }', distractors: ['public String code; public void setCode(String c) { code = c; }', 'protected static String code;', 'String code; // default access is always private'], at: 1 }
    },
    'JOP-U1-04': {
      suspect: { prompt: 'Which statement accurately describes Java execution across platforms?', correct: '`javac` compiles source to bytecode; a compatible JVM executes that bytecode on each platform.', distractors: ['A `.java` file is executed directly by the operating system.', 'Java recompiles itself every time a method is called.', 'The JDK is only a text editor and cannot compile code.'], at: 1 },
      reason: { prompt: 'What makes the claim "write once, run anywhere" possible?', correct: 'The JVM provides a platform-specific runtime for a shared bytecode format.', distractors: ['Every Java program uses the same physical processor.', 'Source code contains no operating-system dependencies.', 'The `main` method converts Java into machine code.'], at: 0 },
      fix: { prompt: 'Which command sequence is valid for `Brief.java`?', correct: 'javac Brief.java, then java Brief', distractors: ['java Brief.java, then javac Brief.class', 'jvm Brief.java, then run Brief.class', 'compile Brief, then main Brief.java'], at: 3 }
    },
    'JOP-U1-05': {
      suspect: { prompt: 'Which component is missing when bytecode cannot run on a target machine?', correct: 'A compatible Java Virtual Machine (JVM).', distractors: ['A second copy of the `.java` source file.', 'A JavaScript runtime.', 'A different class name for each operating system.'], at: 3 },
      reason: { prompt: 'Why is the JVM relevant to Java portability?', correct: 'It interprets or JIT-compiles the same bytecode for the host platform.', distractors: ['It removes all type checking from Java.', 'It changes every program into JavaScript.', 'It makes source files execute before compilation.'], at: 2 },
      fix: { prompt: 'What is the most accurate deployment response?', correct: 'Provide a supported JRE/JVM for the target platform and distribute the compiled classes or JAR.', distractors: ['Convert each class to a separate operating-system-specific Java syntax.', 'Rename `main` for Linux and Windows.', 'Replace every object with a static variable.'], at: 0 }
    },
    'JOP-U1-06': {
      suspect: { prompt: 'What is the precise failure in the recovered array evidence?', correct: '`badgeIds[3]` is outside an array of length 3; valid indexes are 0, 1 and 2.', distractors: ['An `int` array cannot hold 404.', 'Arrays must start at index 1.', 'The array length changes when a value is assigned.'], at: 2 },
      reason: { prompt: 'Why is this a runtime problem rather than a type conversion issue?', correct: 'The expression uses an `int` index, but the index does not identify an existing array element.', distractors: ['Java requires array indexes to be `long`.', 'The declared array type becomes String after assignment.', 'The compiler treats all index values as valid.'], at: 1 },
      fix: { prompt: 'Which repair stores the third badge correctly?', correct: 'badgeIds[2] = 404;', distractors: ['badgeIds[3] = 404; // Java expands the array', 'badgeIds.length = 4;', 'badgeIds[-1] = 404;'], at: 3 }
    },
    'JOP-U1-07': {
      suspect: { prompt: 'What value is printed by `int points = 40; points += 10 * 2;`?', correct: '60, because `10 * 2` is evaluated before the `+=` assignment.', distractors: ['100, because `+=` runs before multiplication.', '50, because only the first operand is added.', '80, because `+=` doubles the existing value.'], at: 0 },
      reason: { prompt: 'Which rule explains the ledger result?', correct: 'Multiplicative operators have higher precedence than additive and assignment operators.', distractors: ['Assignment always happens before arithmetic.', 'Java evaluates binary operators from right to left.', 'Compound assignment ignores the right-hand expression.'], at: 3 },
      fix: { prompt: 'Which rewrite makes the intended precedence obvious without changing the result?', correct: 'points += (10 * 2);', distractors: ['points =+ 10 * 2;', 'points = points + 10 + 2;', 'points += 10; * 2;'], at: 2 }
    },
    'JOP-U1-08': {
      suspect: { prompt: 'Why does the recovered `while` loop never finish?', correct: '`i` is tested but never updated inside the loop body, so `i < 3` remains true.', distractors: ['`while` loops may not contain `println`.', 'The comparison operator must be `=`.', 'The variable must be declared static.'], at: 1 },
      reason: { prompt: 'Which control-flow condition must hold to terminate this loop?', correct: 'The loop body must eventually make the guard expression evaluate to false.', distractors: ['Every loop must use a `break` statement.', 'The guard must be true before each iteration.', 'Only `for` loops can update a counter.'], at: 2 },
      fix: { prompt: 'Which minimal repair preserves the intended three patrol reports?', correct: 'while (i < 3) { System.out.println(i); i++; }', distractors: ['while (i <= 3) { System.out.println(i); }', 'while (i < 3) { i = 0; }', 'if (i < 3) { System.out.println(i); }'], at: 0 }
    },
    'JOP-U1-09': {
      suspect: { prompt: 'What action creates a usable witness object with its own `name` field?', correct: 'Instantiate `Witness`, then assign the field on that instance before calling `introduce()`.', distractors: ['Call `Witness.introduce()` before any object exists.', 'Assign `name` directly to the class without an object.', 'Declare a second `Witness` class inside `main`.'], at: 3 },
      reason: { prompt: 'Why can two witness objects remember different names?', correct: 'Each instance owns a separate copy of non-static instance fields.', distractors: ['A class duplicates its method source for every object.', 'Java converts instance fields to static values during construction.', 'Only String variables can differ between objects.'], at: 0 },
      fix: { prompt: 'Which sequence is valid Java?', correct: 'Witness w = new Witness(); w.name = "Mira"; w.introduce();', distractors: ['Witness w; w.name = "Mira"; w.introduce();', 'Witness.name = "Mira"; Witness.introduce();', 'new Witness.name("Mira");'], at: 1 }
    },
    'JOP-U1-10': {
      suspect: { prompt: 'Why does `new Detective()` fail for the recovered class?', correct: 'The class declares only `Detective(String)`, so no zero-argument constructor is available.', distractors: ['Constructor names may not match their class.', 'A constructor must return `void`.', 'String arguments cannot initialize objects.'], at: 2 },
      reason: { prompt: 'What happens when a class declares any constructor?', correct: 'Java does not also generate the implicit no-argument constructor.', distractors: ['Java generates a no-argument constructor with empty Strings.', 'All constructors become static.', 'The JVM discards declared constructor parameters.'], at: 1 },
      fix: { prompt: 'Which instantiation matches the available constructor exactly?', correct: 'Detective d = new Detective("Asha");', distractors: ['Detective d = new Detective;', 'Detective d = Detective("Asha");', 'Detective d = new Detective(42);'], at: 3 }
    },
    'JOP-U1-11': {
      suspect: { prompt: 'What compiler obligation is unmet by `int scoreLead(int clues) { int score = clues * 10; }`?', correct: 'The method promises an `int` result but reaches its end without returning one.', distractors: ['A local variable may not use multiplication.', 'Methods returning int cannot accept int parameters.', 'The method must be named `main`.'], at: 1 },
      reason: { prompt: 'Why is printing `score` not an equivalent repair?', correct: 'Printing has a side effect but does not provide an `int` value to the caller.', distractors: ['`println` returns the last printed value.', 'Java automatically returns local variables after printing.', 'A void method can be assigned to an int variable.'], at: 3 },
      fix: { prompt: 'Which line correctly completes the method?', correct: 'return score;', distractors: ['print score;', 'return void;', 'break score;'], at: 0 }
    },
    'JOP-U1-12': {
      suspect: { prompt: 'Why is `archive.seal` inaccessible from another class?', correct: '`seal` is private, so only members of `Archive` may access it directly.', distractors: ['The field is a String instead of an int.', 'Objects cannot have fields outside constructors.', 'A private class cannot create objects.'], at: 0 },
      reason: { prompt: 'Which access-control purpose is served here?', correct: 'The class can expose a controlled operation without allowing callers to mutate or inspect its representation freely.', distractors: ['private makes a member available to all subclasses everywhere.', 'public removes the need for methods.', 'default access is visible to every Java program.'], at: 2 },
      fix: { prompt: 'Which method safely exposes the sealed value for reading?', correct: 'public String getSeal() { return seal; }', distractors: ['private String getSeal() { return archive.seal; }', 'public static String seal;', 'String getSeal(Archive archive) { return archive; }'], at: 1 }
    },
    'JOP-U1-13': {
      suspect: { prompt: 'Why does an instance `openCases` field fail as a headquarters-wide counter?', correct: 'Every `new CaseCounter()` receives a separate instance field, so the count is not shared.', distractors: ['int fields cannot store counters.', 'Only constructors can change an int field.', 'A class may contain at most one object.'], at: 3 },
      reason: { prompt: 'What does `static` change about a member?', correct: 'It belongs to the class itself and is shared by all instances of that class.', distractors: ['It becomes immutable after the first assignment.', 'It belongs only to the most recently created object.', 'It can be accessed only inside a constructor.'], at: 1 },
      fix: { prompt: 'Which declaration creates one shared counter?', correct: 'static int openCases = 0;', distractors: ['final int openCases = 0;', 'public int openCases = new int();', 'CaseCounter.openCases() = 0;'], at: 2 }
    }
  };

  function optionsFor(question, key, iconsForOptions) {
    const values = [...question.distractors];
    values.splice(question.at, 0, question.correct);
    return values.map((value, i) => ({ [key]: value, icon: iconsForOptions ? iconsForOptions[i] : undefined, correct: value === question.correct }));
  }
  window.JAVA_OOP_UNIT1_CASES = cases.map((row, index) => {
    const [id,title,topic,difficulty,xp,estimatedTime,badge,story,source,legacyCriminal,explanation,fix] = row;
    const challenge = challenges[id];
    const criminal = challenge.suspect.correct;
    const repair = challenge.fix.correct;
    const isMaster = difficulty === 'Master Detective';
    const color = difficulty === 'Chief Detective' ? 'purple' : isMaster ? 'amber' : 'crimson';
    const types = ['Multiple Choice', 'Identify the Error', 'Complete the Java Code'];
    return {
      id, unitId: 'JAVA_OOP_UNIT1', caseNumber: `Case ${index + 1}`, orderIndex: index,
      title, topic, division: 'OBJECT ORIENTED PROGRAMMING USING JAVA — Unit I',
      difficulty, detectiveRank: difficulty, difficultyColor: color, xpReward: xp, estimatedTime,
      filename: `Case${index + 1}.java`, description: story, bannerSnippet: source.split('\n')[0],
      criminal, detectorNote: `Mission objective: use the Java evidence to resolve the ${topic} incident, then document the verified repair.`,
      story: {
        introduction: `Introduction: ${story}`,
        crimeScene: `Crime Scene: ${topic} has been mishandled in the headquarters system.`,
        evidence: `Evidence: The recovered Java fragment is preserved in ${id}.`,
        witnessStatements: ['The operator saw the symptom after a recent code change.', `The analyst confirms: ${explanation}`],
        investigation: `Investigation: establish the concept, identify the defect, and apply a safe Java repair.`,
        finalReport: `Final Report: ${criminal} was responsible. ${explanation}`,
        verdict: 'Verdict: case closed after the corrected Java evidence was verified.',
        learningSummary: explanation
      },
      missionObjective: `Recover the correct ${topic} design decision and repair the affected case file.`,
      evidenceFolder: { name: `${id}-evidence`, files: [`${id}.java`, 'witness-statement.txt', 'forensic-notes.md'] },
      code: source.split('\n').map((text, i) => ({ text: text.replace(/</g,'&lt;').replace(/>/g,'&gt;'), bug: i === source.split('\n').length - 1 })),
      javaCodeEvidence: source,
      clues: Array.from({ length: 6 }, (_, i) => ({ icon: icons[i], text: [explanation, `The mission objective is to resolve ${topic}.`, 'Read the Java types, names and scopes literally.', 'Reject repairs that change the symptom without satisfying the Java language rule.', 'A correct answer should preserve the intended behavior.', `The final report must connect the code to ${topic}.`][i] })),
      investigationNotebook: { prompts: ['What does the code currently do?', 'Which Java rule applies?', 'What repair protects the case?'], finalReportTemplate: 'Cause → Java rule → repair → verified outcome.' },
      interactiveQuestions: types.map((type, i) => {
        const sourceQuestion = [challenge.suspect, challenge.reason, challenge.fix][i];
        const values = [...sourceQuestion.distractors];
        const correctAt = sourceQuestion.at;
        values.splice(correctAt, 0, sourceQuestion.correct);
        return { id: `${id}-Q${i + 1}`, type, prompt: sourceQuestion.prompt, options: values, correctIndex: correctAt, answer: sourceQuestion.correct, feedback: sourceQuestion.correct };
      }),
      hints: ['Start by separating what the code proves from what it merely suggests.', `Apply this Java rule: ${explanation}`, `Test the repair against the evidence, not the option wording.`],
      completionBadge: badge, learningSummary: explanation,
      xpCalculation: { baseXP: xp, hintsUsed: '-10 DXP each (minimum 0)', accuracy: 'Tracked from investigation decisions' },
      suspectPrompt: challenge.suspect.prompt,
      reasonPrompt: challenge.reason.prompt,
      fixPrompt: challenge.fix.prompt,
      suspects: optionsFor(challenge.suspect, 'name', ['🧩', '🔍', '🎯', '⚖️']),
      reasons: optionsFor(challenge.reason, 'text'),
      fixes: optionsFor(challenge.fix, 'text')
    };
  });
})();
