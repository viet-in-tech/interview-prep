const PROJECTS = [
  {
    id: "serverless-ai",
    title: "Serverless AI Application",
    subtitle: "AWS Lambda, Bedrock & API Gateway",
    institution: "AWS Cloud Institute",
    year: "2026",
    type: "Guided Project",
    description: [
      "Built a serverless AI application on AWS using Lambda, API Gateway, and Amazon Bedrock, connecting an LLM backend to a frontend via a CORS-enabled REST API.",
      "Engineered structured JSON prompts to generate formatted flashcards from study notes, demonstrating end-to-end ownership of a full-stack AI pipeline."
    ],
    tags: ["AWS Lambda", "API Gateway", "Amazon Bedrock", "REST API", "CORS", "JSON", "Serverless"],
    qa: [
      {
        q: "Why was Lambda used instead of a traditional server?",
        a: "Lambda is serverless — it only runs when triggered (e.g., when someone submits study notes). A traditional server runs 24/7 and you pay for it even when idle. Lambda's benefits here: no server to manage or maintain, scales automatically (1 or 1,000 simultaneous users, AWS handles it), and you only pay per invocation — very cost-efficient for sporadic traffic like a flashcard app."
      },
      {
        q: "Why was CORS needed?",
        a: "Browsers enforce a Same-Origin Policy: a webpage can only make API calls to the same domain it came from. In this project the frontend and the API Gateway were on different origins (different URLs/domains). Without CORS headers, the browser blocks the request entirely — the app breaks. Enabling CORS on API Gateway adds response headers that tell the browser: 'I explicitly allow requests from this other origin — it's safe to proceed.'"
      }
    ]
  }

  ,
  {
    id: "churn-prediction",
    title: "Beta Bank Customer Churn Prediction",
    subtitle: "Binary Classification · Class Imbalance Handling",
    institution: "TripleTen · Sprint 9 — Feature Engineering",
    year: "2026",
    type: "ML Project",
    description: [
      "Built a binary classification pipeline to predict whether Beta Bank customers would churn, addressing a real-world class imbalance where only ~20% of customers had left the bank.",
      "Benchmarked three imbalance strategies (class weights, upsampling, downsampling) across Logistic Regression, Decision Tree, and Random Forest — then tuned 108 hyperparameter combinations via GridSearchCV — achieving F1 = 0.6197 and ROC-AUC = 0.8618, exceeding the target of F1 ≥ 0.59."
    ],
    tags: ["Python", "scikit-learn", "Pandas", "NumPy", "Matplotlib", "Random Forest", "GridSearchCV", "Class Imbalance", "Feature Engineering"],
    qa: [
      {
        q: "Why is customer churn prediction valuable to a bank?",
        a: "Acquiring a new customer costs 5–25× more than retaining an existing one. Churn prediction lets the bank intervene proactively — offering targeted incentives or outreach to at-risk customers before they leave. A model that correctly identifies churners enables the business to maximize retention ROI: intervening only where it matters rather than running blanket, expensive campaigns across the entire customer base."
      },
      {
        q: "The dataset had ~20% churn. Why is that a problem for machine learning?",
        a: "With only 20% positive examples, a naive model can achieve 80% accuracy by predicting 'no churn' for everyone — without learning anything useful. Most algorithms optimize for overall accuracy, so the minority class gets systematically under-predicted. The model looks great on paper but misses almost every actual churner, which is precisely what the business cares about. This is the class imbalance problem."
      },
      {
        q: "What were the three class-imbalance strategies you tested and how do they differ?",
        a: "Class weights (class_weight='balanced'): penalizes misclassifying the minority class more heavily during training — no data is changed, only the loss function. Upsampling (oversampling): adds duplicate or synthetic minority-class examples to the training set (used a 60/40 ratio), so the model sees churners more often. Downsampling (undersampling): randomly removes majority-class examples to balance the classes (50/50 ratio), shrinking the training set. Class weights was ultimately most effective — it rebalanced the loss without discarding data or introducing redundancy."
      },
      {
        q: "Why was F1 score chosen as the primary metric instead of accuracy?",
        a: "Accuracy is misleading on imbalanced data: predicting 'no churn' for everyone gives 80% accuracy but zero recall on churners. F1 is the harmonic mean of Precision and Recall — it penalizes both false positives (false alarms) and false negatives (missed churners). The harmonic mean is key: a model with 90% precision but 10% recall still gets a terrible F1 of ~0.18, so the model must perform well on both. The project threshold was F1 ≥ 0.59."
      },
      {
        q: "What is ROC-AUC and what does a score of 0.8618 tell you?",
        a: "ROC-AUC (Receiver Operating Characteristic — Area Under the Curve) measures how well the model ranks positives above negatives across all possible classification thresholds. An AUC of 0.8618 means: if you randomly pick one churner and one non-churner, the model assigns the churner a higher probability score ~86% of the time. It's threshold-independent — a good complement to F1, which captures performance at one specific threshold. ROC-AUC captures the model's overall discriminative ability."
      },
      {
        q: "How did you handle the missing values in the Tenure column?",
        a: "Tenure had ~9.7% missing values. I conducted a MAR analysis — checking whether missingness correlated with other observed features (geography, age, balance, etc.). Finding no systematic pattern, I classified it as MAR (Missing at Random) and imputed with the median. The median was chosen over the mean because it's more robust to any skew or outliers — mean imputation on skewed data can artificially shift the distribution and introduce bias."
      },
      {
        q: "What does MAR (Missing at Random) mean, and why does it matter for imputation?",
        a: "Missing data falls into three types: MCAR (no pattern at all), MAR (missingness depends on other observed variables, but not on the missing value itself), and MNAR (missingness depends on the missing value — e.g., high earners don't report salary). Simple imputation is valid for MCAR and MAR. MNAR requires more advanced treatment or it introduces systematic bias. Establishing MAR before imputing is what methodologically justifies the approach — otherwise you're making an unjustified assumption."
      },
      {
        q: "Why was one-hot encoding used for Geography but binary encoding for Gender?",
        a: "One-hot encoding creates a separate binary column per category — appropriate for Geography (France, Germany, Spain) since there are three nominal categories with no natural order. Binary encoding (Female=1, Male=0) works for Gender because it's a two-category feature; one binary column captures all the information. Using one-hot on a 2-category feature adds a redundant column (each is the complement of the other). Ordinal encoding for nominal data would imply a false numerical ranking between categories."
      },
      {
        q: "Why were RowNumber, CustomerId, and Surname dropped?",
        a: "These are identifiers, not predictive features. RowNumber is an arbitrary index. CustomerId is a database key with no signal. Surname is a name — keeping it would cause the model to memorize individual customers rather than learn generalizable patterns, and raises privacy concerns. Including identifiers also risks data leakage: if any happened to correlate with the target by chance in the training set, the model would exploit that spurious relationship and fail badly on new data."
      },
      {
        q: "Why apply StandardScaler to numerical features?",
        a: "StandardScaler transforms features to mean=0, standard deviation=1. Without it, features on large scales dominate gradient-based models: 'Balance' ranges 0–250,000 while 'NumOfProducts' ranges 1–4, so Balance would drown out the smaller feature in loss-function updates. Logistic Regression is particularly sensitive to scale. Random Forest is theoretically scale-invariant (splits on thresholds, not magnitudes), but scaling was applied uniformly to all models for a fair, apples-to-apples comparison."
      },
      {
        q: "Why use a three-way 60/20/20 stratified split instead of just train/test?",
        a: "Three distinct roles: training set trains the model, validation set tunes hyperparameters and selects the best model, test set gives a final unbiased performance estimate. If you tune hyperparameters on the test set, you've seen it indirectly — reported performance is optimistically biased. Stratification ensures each split maintains the ~20% churn ratio, preventing a scenario where by chance all churners landed in training, making validation results unreliable."
      },
      {
        q: "How does GridSearchCV work? What did you tune?",
        a: "GridSearchCV exhaustively trains and evaluates the model for every combination of specified hyperparameter values. With 3-fold CV, each combination is evaluated 3× on different train/validation sub-splits of the training data — the mean validation F1 ranks each combination. I tuned n_estimators (number of trees), max_depth, min_samples_split, and min_samples_leaf — producing 108 combinations × 3 folds = 324 model fits. The best combination is then retrained on the full training set and evaluated once on the held-out test set."
      },
      {
        q: "Why did Random Forest outperform Logistic Regression and the Decision Tree?",
        a: "Logistic Regression assumes a linear decision boundary — churn is driven by nonlinear feature interactions (e.g., older customers with low balance and many products), so LR underfits. A single Decision Tree captures nonlinearities but overfits: it memorizes training data and generalizes poorly. Random Forest is an ensemble of many trees, each trained on a random data subset and random feature subset (bagging + feature randomness). This diversity cancels out individual tree errors, yielding lower variance without the high bias of LR or the overfitting of a single tree."
      },
      {
        q: "What is the difference between precision and recall in the context of churn?",
        a: "Precision = of everyone the model flagged as churners, what fraction actually churned (how accurate your flags are). Recall = of everyone who actually churned, what fraction did the model catch (how few you miss). High recall means fewer missed churners, but you'll over-target non-churners with retention offers. High precision means efficient targeting, but more churners slip through. The right tradeoff depends on costs: if missing a high-value churner is expensive, prioritize recall; if retention offers are costly to deploy, prioritize precision."
      },
      {
        q: "What is overfitting and how does Random Forest address it?",
        a: "Overfitting is when a model learns the noise in training data rather than the underlying pattern — excellent training performance but poor generalization to new data. A deep single decision tree is the classic example. Random Forest addresses this via two mechanisms: bagging (each tree trains on a bootstrap sample — ~63% of rows, drawn with replacement, so trees see different data) and feature randomness (each split evaluates only a random subset of features). Trees overfit in different directions, and averaging their predictions cancels out individual errors — reducing variance without increasing bias."
      },
      {
        q: "If you could improve this model further, what would you do?",
        a: "Several directions: (1) Try SMOTE (Synthetic Minority Oversampling Technique) — it generates new synthetic minority examples by interpolating between existing ones, more principled than simple duplication. (2) Test gradient boosting models like XGBoost or LightGBM, which often outperform Random Forest on tabular data by sequentially correcting errors. (3) Engineer new features such as a balance-to-salary ratio or activity-per-year metric to capture interaction effects. (4) Optimize GridSearchCV on ROC-AUC instead of F1, then tune the decision threshold post-training based on actual business cost of false negatives vs false positives."
      }
    ]
  }

  ,
  {
    id: "megaline-plan-recommendation",
    title: "Mobile Plan Recommendation Engine",
    subtitle: "Binary Classification · Decision Tree & Random Forest",
    institution: "TripleTen · Sprint 8 — Introduction to Machine Learning",
    year: "2025",
    type: "ML Project",
    description: [
      "Built a binary classification model to recommend whether Megaline telecom customers should be on the Smart or Ultra plan based on their monthly usage behavior (calls, minutes, messages, data).",
      "Evaluated Decision Tree and Random Forest across two validation rounds with hyperparameter tuning, achieving 81.8% accuracy — exceeding the ≥75% project target by +6.8%."
    ],
    tags: ["Python", "scikit-learn", "Pandas", "Decision Tree", "Random Forest", "Binary Classification", "Hyperparameter Tuning"],
    qa: [
      {
        q: "What is the business problem this model solves?",
        a: "Megaline wants to move customers off legacy plans and onto one of two modern plans: Smart or Ultra. Without a model, a sales rep would have to manually review each customer's usage data and make a judgment call — unscalable across thousands of customers. The classification model automates this: given a customer's monthly usage (calls made, minutes used, messages sent, MB of data consumed), it recommends the plan most likely to fit their behavior. The business benefit is proactive, data-driven recommendations that improve customer satisfaction and reduce plan mismatch."
      },
      {
        q: "Why did you skip feature scaling for this project?",
        a: "Feature scaling is required for algorithms that compute distances between data points — Logistic Regression, KNN, SVM, Neural Networks — where a feature with large values (like mb_used, which can reach ~50,000) would dominate over smaller features (like calls, which max around 244). But Decision Trees and Random Forests work by making binary splits on individual feature thresholds: 'Is mb_used > 12,500? Yes → go left. No → go right.' The absolute scale of a feature does not affect where the split occurs or which branch is chosen. Scaling would add complexity with zero performance benefit for tree-based methods."
      },
      {
        q: "How does a Decision Tree make a prediction?",
        a: "A Decision Tree learns a series of binary yes/no questions from the training data — finding the feature and threshold that best separates the classes at each node (using metrics like Gini impurity or information gain). For example: 'Is mb_used > 12,500? If yes → is minutes > 230? ...' This creates a tree structure. To classify a new customer, their feature values are passed through the tree from root to leaf, following the appropriate branch at each decision node. The label at the leaf node is the prediction. A single deep tree can fit training data perfectly but tends to overfit — memorizing noise rather than learning generalizable patterns."
      },
      {
        q: "How does Random Forest improve on a single Decision Tree?",
        a: "Random Forest is an ensemble of many decision trees, using two sources of randomness to reduce overfitting: (1) Bagging — each tree trains on a bootstrap sample of the data (random rows drawn with replacement, ~63% unique). Trees see different subsets and overfit in different directions. (2) Feature randomness — at each split, only a random subset of features is considered (max_features='sqrt' means √4 ≈ 2 features per split). This prevents any one dominant feature from controlling every tree. Final prediction is a majority vote across all trees. The ensemble cancels out individual tree errors — lower variance without increasing bias."
      },
      {
        q: "Why use a 60/20/20 three-way split instead of just train/test?",
        a: "Three distinct roles: the training set trains the model, the validation set evaluates different hyperparameter settings and selects the best model, and the test set provides a final unbiased performance estimate. If you tune hyperparameters on the test set, you've effectively seen it indirectly — reported accuracy becomes optimistically biased (you're measuring how well you fit the test set, not how well you generalize to truly unseen data). The validation set absorbs that overfitting risk, keeping the test set genuinely held out. I used stratified splits to preserve the ~69/31 Smart/Ultra class ratio in all three sets."
      },
      {
        q: "Why did you focus on Accuracy and Precision instead of F1 for this project?",
        a: "Metric choice depends on the business stakes of each type of error. Here, missing an Ultra recommendation is not catastrophic — a customer can upgrade their plan later if they realize they need more data or minutes. This makes recall less critical. Accuracy answers 'how often does the model recommend the right plan across all customers?' — useful for understanding overall reliability. Precision answers 'when the model recommends Ultra, how often is that correct?' — directly tied to customer trust. A low-precision model that over-recommends Ultra would damage trust. F1 balances precision and recall, but since recall carries lower business weight here, F1 would underweight the metric that actually matters most."
      },
      {
        q: "What hyperparameters did you tune, and what changed between validation attempts?",
        a: "Two tuning dimensions: (1) Decision Tree: increased max_depth from 6 to 10, reduced min_samples_split from 20 to 10, reduced min_samples_leaf from 10 to 5. Allowing deeper splits gave the tree more room to capture complex patterns. (2) Random Forest: increased n_estimators from 100 to 10,000 trees, added min_samples_leaf=2. Going from 100 to 10,000 trees is a 100x increase in ensemble size. In practice, the marginal improvement diminished quickly — precision improved +2.3% and accuracy improved only +0.4%. This is a key learning: there are diminishing returns to adding more trees, and the computational cost rises linearly while performance gains plateau."
      },
      {
        q: "Did increasing from 100 to 10,000 trees significantly improve performance?",
        a: "Not dramatically. Validation accuracy improved from 79.5% to 79.9% (+0.4%), and precision improved from 71.4% to 73.7% (+2.3%). The law of diminishing returns applies here — most of the variance reduction from ensembling is achieved within the first few hundred trees. Beyond ~300–500 trees, additional trees contribute very little to accuracy while linearly increasing training and inference time. For production use, a practical engineer would benchmark accuracy vs. n_estimators and choose the 'elbow point' — enough trees for stable performance without unnecessary compute cost. Running 10,000 was informative as an experiment, but 200–500 would likely yield the same result."
      },
      {
        q: "What is max_depth and why does it control overfitting?",
        a: "max_depth limits how many levels deep a decision tree can grow. A tree with no depth limit will keep splitting until every leaf is pure — perfectly fitting training data but memorizing noise. For example, with max_depth=None, a tree might learn 'if mb_used is exactly 23,847 MB → Ultra' — a rule with no generalization value. Constraining max_depth forces the tree to find splits that generalize across many examples rather than fitting individual data points. It's a regularization mechanism: lower max_depth = higher bias, lower variance (underfitting risk); higher max_depth = lower bias, higher variance (overfitting risk). The right value is found empirically via validation."
      },
      {
        q: "The dataset had a 69/31 class split (Smart vs Ultra). Is that a problem?",
        a: "It's mild class imbalance — worth noting but not severe enough to require the same interventions as the churn project (which was 80/20). With 31% Ultra examples, a naive 'always predict Smart' baseline would achieve 69% accuracy — below the 75% target, so the model must actually learn to distinguish Ultra users. I used stratified splits to ensure the 69/31 ratio was maintained in all three data splits, preventing a scenario where, by chance, Ultra customers ended up disproportionately in one split. For more severe imbalance (<10% minority class), techniques like class weights, upsampling, or SMOTE would be needed."
      },
      {
        q: "How does Gini impurity work as a split criterion?",
        a: "Gini impurity measures how often a randomly chosen element from the node would be incorrectly classified if labeled randomly according to the class distribution. For a node with 70% Smart and 30% Ultra: Gini = 1 - (0.70² + 0.30²) = 1 - (0.49 + 0.09) = 0.42. A pure node (all one class) has Gini = 0. The tree evaluates every possible split on every feature and chooses the split that maximally reduces Gini impurity — creating two child nodes that are purer than the parent. This greedy search continues level by level until max_depth is reached or nodes are already pure."
      },
      {
        q: "What does max_features='sqrt' mean and why is it used in Random Forest?",
        a: "At each split decision within a Random Forest tree, max_features='sqrt' means the algorithm only considers √(number of features) features randomly selected from the full feature set. With 4 features: √4 = 2 features per split. This intentional restriction is what creates the diversity that makes Random Forest powerful — if all trees could see all features at every split, they'd all tend to make similar splits (dominated by the most predictive feature), producing correlated trees whose errors don't cancel out. By forcing each split to work with a random subset, trees develop different decision paths, and averaging uncorrelated trees reduces variance much more effectively."
      },
      {
        q: "What would you do differently if you were continuing this project?",
        a: "Several extensions: (1) Benchmark n_estimators more systematically — plot accuracy vs. tree count to find the practical elbow point rather than jumping straight to 10,000. (2) Try GridSearchCV for systematic hyperparameter search across max_depth, min_samples_split, min_samples_leaf, and n_estimators simultaneously, rather than manual trial-and-error. (3) Add feature importance analysis — Random Forest gives a built-in feature_importances_ attribute showing which features drive predictions most. Knowing that mb_used dominates (likely) has business value. (4) Consider Gradient Boosting (XGBoost/LightGBM) which often outperforms Random Forest on tabular classification tasks."
      }
    ]
  }

  // ── Future projects will be added here ──────────────────────
];
