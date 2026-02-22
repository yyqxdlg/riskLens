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


1. Age (Range: 18–80)
Age is categorized to reflect different stages of cardiovascular risk development, focusing on the clinical "40+" intervention threshold.

Young Adult (18–39): Baseline risk group.

Middle-Aged (40–59): The critical window for lifestyle intervention and early screening.

Senior (60–74): High-risk group requiring consistent monitoring.

Elderly (75–80): Very high-risk group due to physiological aging.

2. Body Mass Index / BMI (Range: 14.9–68.9)
Categorized according to CDC (Centers for Disease Control and Prevention) standards.

Underweight: < 18.5

Healthy: 18.5–24.9

Overweight: 25.0–29.9

Obese I: 30.0–34.9

Severe Obesity: ≥ 35.0 (Covers the dataset's upper limit of 68.9).

3. Blood Pressure / Systolic (Range: 70–215 mmHg)
Categorized based on the 2017 AHA/ACC (American Heart Association) guidelines.

Low: < 90

Normal: 90–119

Elevated: 120–129

Stage 1: 130–139

Stage 2: 140–179

Crisis: ≥ 180 (The most critical risk level).

4. Blood Lipids / Total Cholesterol (Range: 62–438 mg/dL)
Categorized based on the NIH/ATP III (National Institutes of Health) standards.

Desirable: < 200

Borderline: 200–239

High: 240–399

Extreme: ≥ 400 (Typically indicates familial risk).

5. Diabetes Status
Categorized as a binary classification for cardiovascular risk attribution.

Non-Diabetic (0): No clinical diagnosis of diabetes.

Diabetic (1): Clinically diagnosed; considered a major CVD risk factor.

6. CVD Status
Categorized as a binary classification for cardiovascular .

Non-CVD (0): No clinical diagnosis of CVD.

CVD (1): Clinically diagnosed.

