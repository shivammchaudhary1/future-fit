# Future Fit MVP v1 Blueprint

## 1. Product Goal

Future Fit is an India-first career guidance platform for students in Classes 9–12.

The MVP should help a student:

- create an account
- take structured assessments
- receive a scored student profile
- receive ranked career recommendations
- understand why careers were recommended
- explore Indian education and career pathways
- use the platform independently or through a school

The MVP should also support:

- Super Admin
- School Admin / Principal
- Teacher
- Student / Normal User
- Guardian relationship access

The first version should remain low-cost and should not depend on expensive external career APIs.

---

## 2. User and Role Model

### Super Admin

Platform owner.

Access:

- all schools
- all users
- all assessments
- all career data
- platform analytics
- assessment authoring
- career-data management
- audit data
- payments/products
- system configuration

Default dashboard:

`/admin/dashboard`

### School Admin / Principal

Represents a school administrator.

Access only inside their own school:

- all teachers
- all students
- classes
- memberships
- assessment assignments
- school completion
- school results
- school analytics

Default dashboard:

`/school/dashboard`

### Teacher

Teacher is connected to a school.

Teacher can see:

- assigned classes
- assigned students
- school-assigned assessments
- completion for assigned students
- school-context results for assigned students
- permitted student records

Teacher cannot automatically see all students in the school.

Default dashboard:

`/teacher/dashboard`

### User / Student

Every normal account is a Future Fit user.

The same user may be:

- independent
- linked to a school with `STUDENT` membership

Independent user:

- personal assessments
- personal results
- career library
- payments
- profile

School-linked student:

- everything above
- school membership
- school assignments
- class mapping
- teacher mapping
- school-context results

Default dashboard:

`/student/dashboard`

### Guardian

Guardian is not a global role.

Guardian access is created using a relationship between:

- student
- guardian

Guardian can see:

- relationship requests
- consent
- approved child links
- reports explicitly shared/allowed

Default dashboard:

`/guardian/dashboard`

---

## 3. Workspace Routing

After login:

```text
SUPER_ADMIN  -> /admin/dashboard
SCHOOL_ADMIN -> /school/dashboard
TEACHER      -> /teacher/dashboard
USER/STUDENT -> /student/dashboard
GUARDIAN     -> /guardian/dashboard
```

Route protection must also exist.

Examples:

```text
Teacher opening /student/dashboard
-> redirect to /teacher/dashboard

Guardian opening /assessments
-> redirect to /guardian/dashboard

Student opening /teacher/dashboard
-> redirect to /student/dashboard
```

If a person has multiple valid workspaces, later versions may add a workspace switcher.

---

## 4. Assessment System

The MVP assessment engine should produce a Student Fit Profile.

### 4.1 Interest Assessment

Framework:

RIASEC

Dimensions:

- Realistic
- Investigative
- Artistic
- Social
- Enterprising
- Conventional

Question style:

5-point preference scale.

Example:

```text
I enjoy figuring out why something works the way it does.

1 Strongly dislike
2 Dislike
3 Neutral
4 Enjoy
5 Strongly enjoy
```

Initial target:

- around 60 items
- roughly 10 items per RIASEC dimension

Output:

```text
R
I
A
S
E
C
```

Normalized to a 0–100 Future Fit interest score.

Top dimensions can generate a 3-letter profile such as:

`IAS`

Important:

This score represents preference within the assessment, not intelligence or guaranteed career suitability.

---

### 4.2 Personality Assessment

Framework:

Big Five

Preferred source approach:

Public-domain IPIP-based items.

Dimensions:

- Openness
- Conscientiousness
- Extraversion
- Agreeableness
- Emotional Stability

Question style:

5-point accuracy/agreement scale.

Support:

- positive-keyed items
- reverse-keyed items

Initial target:

30–50 items.

Output:

0–100 normalized scores for each Big Five dimension.

Important:

This is for career exploration, not medical or clinical diagnosis.

---

### 4.3 Aptitude Assessment

Future Fit should build its own original aptitude question bank.

Initial domains:

- Logical Reasoning
- Numerical Reasoning
- Verbal Reasoning
- Spatial Reasoning
- Data Interpretation
- Pattern Recognition

Initial target:

around 60 questions.

Question metadata:

```text
questionId
domain
difficulty
skill
gradeBand
correctAnswer
version
```

Initial scoring:

```text
correct = 1
incorrect = 0
```

Domain score:

```text
correct / total * 100
```

Do not introduce fake advanced psychometric weighting in MVP.

Later versions can calibrate difficulty using real response data.

---

### 4.4 Values and Work Preference Assessment

Possible dimensions:

- Achievement
- Independence
- Helping Others
- Recognition
- Stability
- Creativity
- Leadership
- Work-Life Balance
- Financial Reward
- Learning

Question style:

5-point importance scale.

Example:

```text
It is important to me to have freedom in how I do my work.
```

Initial target:

30–40 items.

Output:

normalized preference scores.

---

### 4.5 Academic and Education Survey

This should capture context rather than personality.

Possible inputs:

- class
- board
- subjects
- strongest subjects
- preferred subjects
- stream preference
- marks/ranges
- willingness for long education
- relocation preference
- budget constraints
- entrance-exam interest
- preferred work environment

Initial target:

15–20 questions.

---

## 5. Student Fit Profile

After scoring, Future Fit should create one structured profile.

Example:

```json
{
  "interest": {
    "R": 42,
    "I": 87,
    "A": 66,
    "S": 44,
    "E": 59,
    "C": 70
  },
  "aptitude": {
    "logical": 88,
    "numerical": 76,
    "verbal": 61,
    "spatial": 68,
    "dataInterpretation": 74,
    "patternRecognition": 84
  },
  "personality": {
    "openness": 81,
    "conscientiousness": 77,
    "extraversion": 55,
    "agreeableness": 63,
    "emotionalStability": 69
  },
  "values": {
    "innovation": 90,
    "independence": 82,
    "stability": 67,
    "helpingOthers": 51
  }
}
```

The profile must be versioned.

Store:

- assessment version
- scoring version
- date
- raw score
- normalized score

---

## 6. Career Database

Future Fit should own its career database in MongoDB.

Do not depend on a live paid career API for every student.

### 6.1 Career Sources

Initial source strategy:

```text
NCO / Indian occupational classification
+
NSDC Qualification Packs / NOS job roles
+
NCS discovery and validation
+
ESCO occupations and skills as supplementary data
+
Future Fit curated emerging careers
```

Before production use, licensing and reuse conditions for every imported source must be documented.

### 6.2 Coverage Goal

The database should be designed to grow toward broad coverage of:

- traditional careers
- modern careers
- vocational careers
- government pathways
- technology careers
- creative careers
- emerging careers

Do not claim mathematically complete coverage of every career in India.

Instead maintain an updateable career registry.

Initial MVP can start with a smaller validated set and expand continuously.

Recommended staged target:

```text
Phase 1: 30 careers
Phase 2: 100 careers
Phase 3: 200+ careers
```

### 6.3 Career Data Model

Each career should contain fields such as:

```json
{
  "slug": "software-engineer",
  "title": "Software Engineer",
  "aliases": [
    "Software Developer"
  ],
  "sector": "Technology",
  "status": "ACTIVE",
  "sourceCodes": [],
  "sources": [],
  "summary": "",
  "tasks": [],
  "skills": [],
  "educationPaths": [],
  "entranceExams": [],
  "streams": [],
  "careerProfile": {},
  "sourceReferences": []
}
```

### 6.4 Import Rule

When new career data is found:

```text
Source career
    |
    v
Normalize title/code/slug
    |
    v
Check MongoDB
    |
    +-- exists -> merge/update sources and details
    |
    +-- not exists -> insert
```

Use source codes and aliases to reduce duplicates.

Example:

```text
Software Engineer
Software Developer
Application Developer
```

should not automatically become three unrelated careers.

---

## 7. Career Requirement Profile

A career recommendation must be based on what work actually happens in the occupation.

Do not invent random percentages such as:

```text
Software Engineer = 90% logic
```

Instead build career profiles from:

```text
occupation
  ->
tasks
  ->
skills
  ->
abilities
  ->
work characteristics
  ->
education requirements
```

Then map those to Future Fit dimensions.

Example:

```text
Task:
debug software failures

Maps to:
- logical reasoning
- problem solving
- attention to detail
- investigative interest
```

Use an importance rubric:

```text
5 = core / essential
4 = strongly important
3 = important
2 = supporting
1 = minor relevance
0 = not used
```

Every important career dimension should store its source or mapping reason.

Example:

```json
{
  "dimension": "logicalReasoning",
  "importance": 5,
  "sourceReferences": [
    "career-task mapping"
  ]
}
```

---

## 8. Career Matching Engine

The engine compares:

```text
Student Fit Profile
        VS
Career Requirement Profile
```

The result is a Future Fit Alignment Score.

It is not a probability of career success.

### Matching Principles

Use:

- interest fit
- aptitude fit
- personality/work-style fit
- values fit
- academic/pathway fit

Career-specific importance should matter more than a single universal weight.

Do not hard-code one universal production formula like:

```text
Interest 30%
Aptitude 25%
Personality 20%
```

unless it is later validated.

### Simple MVP Matching

For a scored dimension:

```text
alignment = 100 - abs(studentScore - careerTarget)
```

Then:

```text
weighted score =
sum(alignment * importance)
/
sum(importance)
```

Career profiles may initially use target ranges instead of exact targets.

Prefer:

```text
CORE
IMPORTANT
SUPPORTING
```

in user-facing explanation.

### Output

Example:

```text
Software Engineering     88
Data Science             83
Cybersecurity            80
Product Management       71
Graphic Design           64
```

UI label:

`Future Fit Alignment`

Do not label it:

`Chance of success`

---

## 9. Career Recommendation Explanation

Every recommendation should be explainable.

Example:

```text
Why Software Engineering matched

Strong alignment:
- Investigative interest
- Logical reasoning
- Pattern recognition
- Innovation preference

Moderate alignment:
- Numerical reasoning
- Communication

Education fit:
- Maths/science preference supports common pathways
```

System must be able to trace:

```text
recommendation
->
career profile
->
career dimensions
->
student dimensions
->
assessment questions
->
student answers
->
scoring version
```

---

## 10. AI Usage

AI should not decide the core career ranking.

AI may be used for:

- simple-language interpretation
- report writing
- Hindi/English explanation
- strengths summary
- suggested next steps

Core ranking should remain deterministic.

The platform should continue to work even if AI is disabled.

This keeps costs low.

---

## 11. Result and Report

Student report should contain:

- assessment completion summary
- interest profile
- aptitude profile
- personality/work-style profile
- values profile
- top career recommendations
- reasons for each recommendation
- education pathways
- entrance exams where relevant
- next actions
- limitations/disclaimer

Future Fit should avoid clinical or guaranteed-success language.

---

## 12. Personal vs School Assessment Privacy

Assessment contexts:

```text
PERSONAL
SCHOOL
```

### PERSONAL

Default visibility:

- student: yes
- teacher: no
- school admin: no
- guardian: only if shared/allowed

### SCHOOL

Default visibility:

- student: yes
- assigned teacher: yes
- school admin: yes
- other teacher: no
- other school: never

Backend authorization must enforce this.

---

## 13. School Mapping

School model:

```text
School
  |
  +-- School Admin
  |
  +-- Teachers
  |
  +-- Classes
  |     |
  |     +-- assigned teachers
  |     +-- enrolled students
  |
  +-- Students
```

Teacher visibility:

```text
Teacher
  ->
assigned class
  ->
students in that class
```

School Admin visibility:

all teachers/students/classes inside that school only.

---

## 14. MVP Dashboards

### Super Admin

Should eventually show:

- schools
- users
- assessments
- careers
- payments
- platform analytics
- audit

### School Admin

- overview
- analytics
- students
- teachers/members
- classes
- assignments
- completion
- results

### Teacher

- overview
- assigned students
- completion
- results
- assignments

### Student / User

- overview
- assessments
- school assignments if linked
- results
- career library
- payments
- profile

### Guardian

- overview
- consent
- relationships
- shared reports

---

## 15. Payment Model

MVP may support:

- free assessment/access
- paid assessment bundles
- school-paid access
- individual purchase

Razorpay remains the intended payment provider.

Payment state must be stored and validated by backend.

---

## 16. PWA and Offline

Current MVP direction:

- installable PWA
- offline shell
- offline assessment draft storage
- reconnect/sync support

Do not cache authenticated API responses in the service worker.

---

## 17. Data Collections

Expected core MongoDB collections:

```text
users
organizations
organization_memberships
school_classes
class_enrollments
guardian_links

assessments
assessment_versions
assessment_attempts
assessment_results

career_records
career_profiles
career_sources
career_skills
career_education_paths

payments
products
entitlements

notifications
audit_logs
```

Exact names may follow current backend schemas.

---

## 18. Versioning

Important systems must be versioned.

Store versions for:

- assessment
- questions
- scoring
- career profile
- matching algorithm
- report
- source import

Example:

```text
assessmentVersion = 1.0
scoringVersion = 1.0
careerProfileVersion = 1.0
matchingVersion = 1.0
```

This allows results to remain reproducible after future updates.

---

## 19. MVP Build Order

Recommended implementation sequence:

```text
1. Role/workspace routing
2. Realistic demo school data
3. Assessment Blueprint v1
4. Question banks
5. Assessment scoring engine
6. Student Fit Profile
7. Career database importer
8. Initial career profiles
9. Matching engine
10. Recommendation explanation
11. Result/report UI
12. PDF report
13. Payment validation
14. Integration tests
15. Production hardening
```

---

## 20. MVP Cost Strategy

Keep the initial system close to zero variable cost.

Use:

```text
MongoDB local/dev
Redis local/dev
NestJS
Next.js
BullMQ
Future Fit scoring code
Future Fit matching code
Future Fit career database
```

AI should be optional.

Avoid:

- paid career APIs
- paid psychometric scoring APIs
- unnecessary third-party dependencies

Spend only after validation/revenue.

---

## 21. MVP Success Criteria

MVP is considered functionally complete when:

1. A normal user can register/login.
2. Role routing works correctly.
3. A school admin can manage their school.
4. A teacher sees only assigned students.
5. A student can take assessments.
6. Assessment answers generate deterministic scores.
7. Scores generate a Student Fit Profile.
8. Career profiles exist in Future Fit's own database.
9. Matching engine returns ranked careers.
10. Every recommendation includes a reason.
11. School/private result visibility is enforced.
12. Guardian only sees allowed/shared information.
13. Report is generated.
14. Payment/access rules work.
15. Core functionality works without requiring AI.
16. All important data/scoring versions are traceable.

---

## 22. Core MVP Principle

The Future Fit recommendation system should always follow:

```text
Assessment Questions
        |
        v
Deterministic Assessment Scoring
        |
        v
Student Fit Profile


Career Source Data
        |
        v
Tasks + Skills + Requirements
        |
        v
Future Fit Career Profile


Student Fit Profile
        +
Future Fit Career Profile
        |
        v
Deterministic Matching Engine
        |
        v
Career Recommendations
        |
        v
Explainable Result
        |
        v
Optional AI Interpretation
```

The core product value is not "AI picked a career."

The core value is:

> Future Fit uses structured assessments and structured career requirement profiles to generate transparent, explainable career-alignment recommendations for Indian students.
