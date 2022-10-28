# Rekker
Finally, a natural way to explore Elastic Net coefficients. *Amai mijne rekker*.

## What is Rekker?

Elastic Net regression is a fantastic technique for assessing the influence of a plethora of predictors on a specific response variable. By looking at the coefficients for each predictor in an Elastic Net regression (or its siblings Ridge and Lasso regression), we can investigate the "pull" of a particular predictor on the modelled phenomenon.

Because we tend to use many predictors at once with Elastic Net-like regression, it becomes a challenge to investigate the results. It is very difficult, for example, to fit 500 data points on a normal sized plot (if we were to have 500 predictors). To combat this issue, I wrote Rekker, an interactive visualisation tool for Elastic Net coefficients.

**Features:**

* display all coefficients in a scrollable plot
* colour-coded data points
* zero coefficient baseline
* tooltip with exact values

## Using Rekker

1. Clone this repository
2. Place your dataset (`coefficients.csv`) in the repository's directory.

	The dataset should have the following structure:
	```csv
	coefficients,features
	-2.7109007348534733,I
	-2.5738031394173366,Monday
	-1.970461593962809,not
	-1.864356619676603,like
	```

3. Serve the repository's directory using an HTTP server, for example by using the built-in Python webserver:

	```
	> python -m http.server
	Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
	```

## Future work

* dynamic resizing
* display model info
* more interactivity