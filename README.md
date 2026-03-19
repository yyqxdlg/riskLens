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

RiskLens is an interactive visualization website for exploring cardiovascular-related health factors.  
It allows users to enter personal health metrics, review a heuristic clinical profile score, compare themselves with the overall and filtered population, and inspect how metric changes affect the resulting profile.

## Project Overview

RiskLens is designed as a course project for clinical risk sensemaking and health-data visualization.  
The website supports user input, subgroup comparison, heuristic profile scoring, and risk simulation through an integrated visual interface.

This project is intended for visualization purposes only and does not provide medical advice or clinical diagnosis.

## Website Structure

The website currently includes the following pages:

- **Home** — main interaction and visualization interface
- **About** — project overview, team information, data abstraction and provenance, task abstraction, scoring logic, feedback incorporation, future work, references, and project links
- **Team** — team member profiles, contribution breakdown, and contact information
- **Demo** — dedicated page for the project demo and presentation access

## Live Website

https://yyqxdlg.github.io/riskLens/

## Source Code

https://github.com/yyqxdlg/riskLens/tree/main

## Demo

The website includes a dedicated Demo page for project presentation and walkthrough access.

## Main Features

- Personal clinical profile scoring based on five core metrics
- Radar-based comparison between user input and population benchmarks
- Subgroup comparison and peer filtering
- Built-in BMI calculator
- Risk simulator / “time machine” exploration
- Summary panel for quick interpretation of the user profile

## Team Members & Workload Distribution

### YU ZHANG — 50%
- Literature review and background research
- Raw data download, cleaning, and preprocessing
- Project planning and design
- Implementation of the summary view
- Implementation of the radar comparison view
- Implementation of the risk simulator
- Bug fixing, testing, and About-page documentation

### ZIFEI LIU — 50%
- Literature review and background research
- Project planning and design
- Implementation of the onboarding flow
- Implementation of the range comparison module
- Implementation of the user form module
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
Thresholds shown in the system were adapted from public-health references and class discussion for educational visualization purposes.

The website is based on processed public data rather than live medical records.

## Task Abstraction

RiskLens supports the following user tasks:

1. **Identify** personal health status from entered clinical metrics
2. **Compare** personal values against the overall population and filtered peer groups
3. **Inspect** how each metric contributes to the overall clinical profile score
4. **Simulate** how changing values may alter the resulting profile over time

## Clinical Scoring Logic

The scoring table used in RiskLens is a heuristic educational summary for interpretation and comparison.  
It is not intended to represent a clinical diagnosis model or validated medical prediction system.

The current scoring logic is based on five dimensions:

- Age
- BMI
- Systolic blood pressure
- Total cholesterol
- Diabetes status

Each metric contributes a positive, neutral, or negative score depending on its category.  
The total score is then mapped to an educational overall risk summary.

## Feedback Incorporation & Design Decisions

The final website incorporates presentation feedback in several ways:

- Clarified diabetes-related labels to reduce ambiguity in the interface
- Added a built-in BMI calculator so users do not need to leave the website
- Improved click-based subgroup interaction in the comparison view
- Refined chart presentation for dimensions with different category counts
- Strengthened the connection between user input and peer-group comparison

The design process did not treat feedback as a checklist alone.  
Instead, feedback was reviewed, interpreted, and incorporated according to dataset constraints, interface clarity, and the overall goals of the visualization.

## Future Work

Possible future extensions include:

- clearer percentile-based peer positioning
- additional health and lifestyle variables
- more transparent score explanations
- stronger explanation of score weighting choices
- improved demo integration and further responsive refinement

## Clinical References

This educational scoring system and categorization design were informed by public-health references and course discussion, including:

- CDC / NHANES
- CDC BMI-related guidance
- ACC/AHA blood pressure guideline references
- public-health references for cholesterol categorization

## Project Setup

```bash
npm install
npm run serve
