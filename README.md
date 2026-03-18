# risklens

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).


# RiskLens

RiskLens is an interactive educational visualization website for exploring cardiovascular-related health factors.  
It allows users to enter personal health metrics, review a heuristic clinical profile score, compare themselves with the overall and filtered population, and inspect how metric changes affect the resulting profile.

## Live Website

https://yyqxdlg.github.io/riskLens/

## Source Code

https://github.com/yyqxdlg/riskLens/tree/main

## Demo Video

The final 2-minute demo video will be linked or embedded in the website's Demo page.

## Main Features

- Personal clinical profile scoring based on five core metrics
- Radar-based comparison between user input and population benchmarks
- Subgroup comparison and peer filtering
- Built-in BMI calculator
- Risk simulator / “time machine” exploration
- Summary panel for quick interpretation of the user profile

## Team Members & Workload Distribution

### YUZHANG — 50%
- Literature review and background research
- Raw data download, cleaning, and preprocessing
- Project planning and design
- Implementation of the summary part, radar part, and risk simulator
- Bug fixing, testing, and About-page documentation

### LIUZIFEI — 50%
- Literature review and background research
- Project planning and design
- Implementation of onboarding, range comparison, and user form modules
- UI refinement and layout optimization
- Bug fixing and testing

## Data Abstraction

The project abstracts NHANES participant records into a set of user-facing health attributes:

- Age
- BMI
- Systolic blood pressure
- Total cholesterol
- Diabetes status

These variables are further transformed into derived categories such as:

- Age group
- BMI category
- Blood pressure category
- Cholesterol category
- Diabetes diagnosis status

The system then computes:

- Metric-level scores
- An overall profile score
- A heuristic risk category
- Subgroup comparison summaries
- Simulation outputs

## Data Provenance

RiskLens uses publicly available data from the CDC’s National Health and Nutrition Examination Survey (NHANES).

Data source:
https://wwwn.cdc.gov/nchs/nhanes/default.aspx

Multiple NHANES survey-cycle files were downloaded, cleaned, merged, and transformed into the fields used in the interface.  
This project is an educational visualization and not a medical diagnosis system.

## Task Abstraction

RiskLens supports the following user tasks:

1. **Identify** personal health status from entered clinical metrics
2. **Compare** personal values against the overall population and filtered peer groups
3. **Inspect** how each metric contributes to the overall profile score
4. **Simulate** how changing values may alter the resulting risk-related profile

## Feedback Incorporation

The final website incorporates presentation feedback in several ways:

- Added a built-in BMI calculator
- Improved click-based subgroup interaction in the range comparison view
- Refined diabetes-related labels for better clarity
- Adjusted chart presentation and spacing in subgroup comparison views
- Strengthened the connection between user input and population comparison

## Clinical References

This educational scoring system and categorization design were informed by public-health references and course discussion, including:

- CDC / NHANES
- CDC BMI-related guidance
- ACC/AHA blood pressure guideline references
- Public-health references for cholesterol categorization

## Project Setup

```bash
npm install
npm run serve

