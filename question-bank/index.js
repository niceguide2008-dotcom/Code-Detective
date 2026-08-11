// Code Detective — reusable academic question bank
// Unit 2 additions only. Existing case data remains untouched.
// The structure is intentionally unit-agnostic so Units 3–5 can append later.

const QUESTION_BANK_SCHEMA_VERSION = 1;

const UNIT_2_13_MARK_QUESTIONS = [
  {
    id: "U2-13M-11",
    unitId: "UNIT_2",
    marks: 13,
    type: "Long Answer",
    question: "Explain single, multilevel and hierarchical inheritance in Java with suitable class diagrams and programs. Compare how members are inherited in each form.",
    topics: ["Inheritance", "Single Inheritance", "Multilevel Inheritance", "Hierarchical Inheritance"],
    answerOutline: ["Definition of inheritance", "Single inheritance with program", "Multilevel inheritance with program", "Hierarchical inheritance with program", "Comparison and conclusion"],
    difficulty: "Medium"
  },
  {
    id: "U2-13M-12",
    unitId: "UNIT_2",
    marks: 13,
    type: "Long Answer",
    question: "Describe method overriding in Java. Explain the rules for overriding, the role of @Override, and demonstrate runtime polymorphism with a suitable program.",
    topics: ["Method Overriding", "Runtime Polymorphism", "Dynamic Method Dispatch"],
    answerOutline: ["Definition", "Overriding rules", "@Override annotation", "Parent reference and child object", "Program and output", "Advantages"],
    difficulty: "Medium"
  },
  {
    id: "U2-13M-13",
    unitId: "UNIT_2",
    marks: 13,
    type: "Long Answer",
    question: "Explain constructor inheritance and constructor chaining in Java. Demonstrate the use of super() with a multilevel inheritance program and explain the order of constructor execution.",
    topics: ["Constructors", "Constructor Chaining", "super()", "Multilevel Inheritance"],
    answerOutline: ["Constructor behavior in inheritance", "Implicit super()", "Explicit super()", "Multilevel program", "Execution order", "Key observations"],
    difficulty: "Medium"
  },
  {
    id: "U2-13M-14",
    unitId: "UNIT_2",
    marks: 13,
    type: "Long Answer",
    question: "Explain the super keyword in Java and discuss its uses for accessing parent-class variables, methods and constructors. Illustrate all three uses with a program.",
    topics: ["super Keyword", "Inheritance", "Method Access", "Constructor Access"],
    answerOutline: ["Purpose of super", "Parent variable access", "Parent method access", "Parent constructor invocation", "Complete example", "Output/explanation"],
    difficulty: "Medium"
  },
  {
    id: "U2-13M-15",
    unitId: "UNIT_2",
    marks: 13,
    type: "Long Answer",
    question: "Differentiate method overloading and method overriding in Java. Explain their rules, compile-time versus runtime polymorphism, and provide suitable programs for both.",
    topics: ["Method Overloading", "Method Overriding", "Compile-time Polymorphism", "Runtime Polymorphism"],
    answerOutline: ["Definitions", "Overloading rules and program", "Overriding rules and program", "Compile-time vs runtime", "Comparison table", "Conclusion"],
    difficulty: "Medium"
  },
  {
    id: "U2-13M-16",
    unitId: "UNIT_2",
    marks: 13,
    type: "Long Answer",
    question: "Explain dynamic method dispatch in Java with a suitable example. Describe how a superclass reference can refer to subclass objects and how the JVM selects the overridden method at runtime.",
    topics: ["Dynamic Method Dispatch", "Runtime Polymorphism", "Superclass Reference", "Method Overriding"],
    answerOutline: ["Concept", "Reference/object relationship", "Overridden methods", "Program", "Runtime method selection", "Advantages and limitations"],
    difficulty: "Hard"
  },
  {
    id: "U2-13M-17",
    unitId: "UNIT_2",
    marks: 13,
    type: "Long Answer",
    question: "Explain abstract classes and abstract methods in Java. Show how abstraction can be combined with inheritance and method overriding using a suitable program.",
    topics: ["Abstract Class", "Abstract Method", "Abstraction", "Inheritance", "Overriding"],
    answerOutline: ["Definition", "Abstract method rules", "Abstract class rules", "Inheritance relationship", "Concrete subclass implementation", "Program and output"],
    difficulty: "Hard"
  },
  {
    id: "U2-13M-18",
    unitId: "UNIT_2",
    marks: 13,
    type: "Long Answer",
    question: "Discuss the advantages and limitations of inheritance in Java. Explain how inheritance promotes code reuse, extensibility and polymorphism, and describe situations where composition is preferable.",
    topics: ["Inheritance", "Code Reuse", "Polymorphism", "Composition"],
    answerOutline: ["Introduction", "Advantages", "Code reuse example", "Extensibility and polymorphism", "Limitations", "Inheritance vs composition", "Conclusion"],
    difficulty: "Hard"
  }
];

const QUESTION_BANK = {
  schemaVersion: QUESTION_BANK_SCHEMA_VERSION,
  units: {
    UNIT_2: {
      id: "UNIT_2",
      title: "OOP - Inheritance & Polymorphism",
      questions: UNIT_2_13_MARK_QUESTIONS
    }
  }
};

if (typeof window !== "undefined") {
  window.CODE_DETECTIVE_QUESTION_BANK = QUESTION_BANK;
}

export {
  QUESTION_BANK_SCHEMA_VERSION,
  UNIT_2_13_MARK_QUESTIONS,
  QUESTION_BANK
};
