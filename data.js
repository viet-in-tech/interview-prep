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
      },
      {
        q: "What is Amazon Bedrock and why use it instead of calling an LLM API directly?",
        a: "Amazon Bedrock is a managed AWS service that provides access to foundation models (Claude, Llama, Titan, and others) through a single standardized API — without requiring you to host or manage any model infrastructure. The reason to use it instead of calling Anthropic's API directly: (1) AWS credentials and IAM roles handle authentication — no separate API key management. (2) The call stays within AWS's network, reducing latency and keeping data off the public internet. (3) Bedrock integrates natively with other AWS services like Lambda, CloudWatch logging, and VPC endpoints. (4) You can swap foundation models by changing one parameter without restructuring your application. Bedrock is the right choice when you're building on AWS and want managed, scalable access to multiple foundation models under a unified interface."
      },
      {
        q: "How does API Gateway work? What does it actually do in this architecture?",
        a: "API Gateway is a managed service that exposes HTTP endpoints (REST or WebSocket) and routes incoming requests to backend services — in this case, Lambda. When a user submits study notes, the browser sends an HTTP POST to an API Gateway URL. API Gateway validates the request, applies any transformations or authentication rules, and then triggers the Lambda function — passing the request payload as an event. Lambda processes it, returns a response, and API Gateway forwards that response back to the browser. API Gateway handles: TLS termination (HTTPS), rate limiting, throttling, CORS headers, and logging — without any of that landing in the Lambda function's code."
      },
      {
        q: "Explain the request lifecycle from browser to Bedrock and back.",
        a: "Full lifecycle: (1) User types study notes in the browser and clicks submit. (2) JavaScript sends an HTTP POST to the API Gateway URL with the notes in the JSON body. (3) API Gateway receives the request, validates it, and invokes the Lambda function — passing the raw HTTP event as a Python dictionary. (4) Lambda extracts the notes from event['body'], calls build_prompt() to format them, then uses the boto3 Bedrock client to call bedrock:InvokeModel with the prompt and model parameters. (5) Bedrock invokes the Claude foundation model, which generates the flashcard JSON. (6) Lambda receives the response, parses the JSON, and returns an HTTP 200 with the flashcards in the body plus CORS headers. (7) API Gateway passes the response back to the browser. (8) JavaScript parses the JSON and renders the flashcards. Every step has a potential failure mode: malformed JSON, missing CORS headers, IAM permission errors, or Bedrock rate limits."
      },
      {
        q: "What is prompt engineering and why does it matter for structured outputs?",
        a: "Prompt engineering is the practice of designing input text that reliably produces desired outputs from a language model. For a flashcard generator, the desired output is a parseable JSON array — not freeform prose, not JSON with explanation text wrapped around it, not JSON with markdown code fences. Getting that requires: (1) Explicitly specifying the output format with a concrete example. (2) Instructing the model to return ONLY the JSON with no additional commentary. (3) Setting a low temperature (0.3) to reduce creative variation and keep outputs predictable. (4) Using the correct prompt format for the model (Claude's Human:/Assistant: turn structure). The cost of inconsistent output is a parsing error in production — the application breaks for users. Prompt engineering is engineering: the goal is reliability, not creativity."
      },
      {
        q: "What IAM role did Lambda use, and what is the principle of least privilege?",
        a: "Lambda functions run under an IAM execution role — a set of permissions that defines what AWS resources the function can access. I created a custom policy attached to the Lambda execution role that granted only bedrock:InvokeModel on the specific Claude model ARN. Nothing else — no S3 access, no DynamoDB access, no ability to invoke other Lambda functions. The principle of least privilege states that any entity (user, service, function) should have exactly the permissions it needs to do its job and nothing more. The practical security benefit: if the Lambda function were compromised through a code vulnerability or dependency issue, the blast radius is limited to what that role can do — which is only invoke one specific Bedrock model. Over-permissive roles (e.g., AdministratorAccess) make every service a potential lateral movement vector."
      },
      {
        q: "How does Lambda scale? What happens if 1,000 users submit notes simultaneously?",
        a: "Lambda scales horizontally and automatically — each invocation runs in its own isolated execution environment. With 1,000 simultaneous requests, AWS spins up up to 1,000 concurrent Lambda instances to handle them in parallel. You don't configure this; it's the default behavior. Each instance is independent — no shared state, no coordination needed. The practical implications: (1) Lambda is naturally stateless — don't store data in memory across invocations because different invocations may run in different containers. (2) Concurrent execution limits exist (soft limit of 1,000 per region by default; can be increased). (3) Cold starts: a new Lambda container takes slightly longer to initialize. For latency-sensitive applications, provisioned concurrency pre-warms instances. (4) The downstream limit is often Bedrock's request rate — at high scale, Bedrock's throttle limits become the bottleneck before Lambda's concurrency does."
      },
      {
        q: "What is a cold start in Lambda and when does it matter?",
        a: "A cold start occurs when AWS needs to initialize a new Lambda execution environment to handle a request — downloading the function code, starting the runtime (Python), and running any initialization code outside the handler function. This takes additional time: typically 200ms–1s for Python Lambdas depending on package size. A warm start happens when AWS reuses an existing execution environment from a previous invocation, which is nearly instant. Cold starts matter when: (1) Your application is latency-sensitive (a user-facing API where 500ms is noticeable). (2) Traffic is sporadic with long gaps between requests — environments get garbage collected after inactivity. For a flashcard app with occasional traffic, cold starts are acceptable. For a high-frequency trading system or real-time streaming, they're a critical problem. Provisioned concurrency pre-warms a defined number of instances to eliminate cold starts entirely."
      },
      {
        q: "Why use JSON as the communication format between frontend and Lambda?",
        a: "JSON (JavaScript Object Notation) is the native data format for web browsers — JavaScript objects serialize and deserialize as JSON with JSON.stringify() and JSON.parse() with no third-party library needed. API Gateway natively handles JSON request and response bodies. Lambda receives the body as a string and Python's json.loads() parses it into a dictionary. The entire web application stack (browser → API Gateway → Lambda → response) shares a common, lightweight, human-readable data format. This uniformity reduces friction: no format translation, no schema mismatch, no binary encoding/decoding. The structured flashcard output from Bedrock was also JSON — meaning the entire pipeline used a single format from browser to model and back."
      },
      {
        q: "What would you change or add if you were extending this project?",
        a: "Several directions: (1) Add DynamoDB persistence — store generated flashcard sets so users can retrieve them later without regenerating. (2) Add a Cognito user pool for authentication — so each user has their own saved sets, and the API is not publicly open. (3) Switch from REST API to a streaming response — Bedrock supports streaming token-by-token output, which would make the UI feel faster (text appears progressively rather than waiting for the full response). (4) Add CloudWatch alarms for Lambda errors and Bedrock throttle responses — currently there's no monitoring. (5) Implement retry logic in Lambda for Bedrock throttling errors with exponential backoff. (6) Add input validation and sanitization in Lambda before sending notes to Bedrock — basic security hygiene for user-provided input."
      },
      {
        q: "What is the difference between REST API and HTTP API in API Gateway?",
        a: "API Gateway offers two API types: REST API (the original, feature-rich product) and HTTP API (newer, simpler, cheaper). REST API supports: custom authorizers, API keys, usage plans, request/response transformations, built-in caching, WAF integration, and more granular stage management. HTTP API supports: JWT authorizers, Lambda and HTTP integrations, automatic CORS configuration, and is ~70% cheaper per million requests. For this project I used REST API — it has more configuration options and was the standard for AWS curriculum. For a new production project with simple routing and no advanced authorization, HTTP API is usually the better choice due to cost and lower operational complexity."
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

  ,
  {
    id: "chicago-taxi-eda",
    title: "Chicago Taxi Market Analysis",
    subtitle: "EDA & Hypothesis Testing · SQL + Python",
    institution: "TripleTen · Sprint 7 — Exploratory Data Analysis",
    year: "2025",
    type: "Data Analysis",
    description: [
      "Analyzed Chicago's taxi market using SQL-sourced data, identifying market concentration patterns across 64 taxi companies and dropoff demand across 94 neighborhoods. Flash Cab led with 19,558 rides in a single weekend — nearly 2× the second-place company.",
      "Conducted a formal independent two-sample t-test to determine whether bad weather statistically significantly increases Loop-to-O'Hare ride duration. Result: t = 6.84, p ≈ 0 — bad weather adds ~6.9 minutes (+20.6%) to the average airport trip."
    ],
    tags: ["Python", "Pandas", "NumPy", "Matplotlib", "Seaborn", "SciPy", "SQL", "Hypothesis Testing", "EDA", "t-test"],
    qa: [
      {
        q: "What were the two main goals of this project?",
        a: "Two distinct goals: (1) EDA — understand Chicago's taxi market structure. Which companies dominate? Which neighborhoods concentrate demand? This involved sorting and visualizing two SQL-sourced datasets: ride counts per company (64 companies) and average dropoffs per neighborhood (94 neighborhoods). (2) Hypothesis testing — rigorously answer whether bad weather makes Loop-to-O'Hare Saturday rides statistically significantly longer. The EDA side is descriptive; the hypothesis test is inferential. Together they show what the market looks like and what one specific factor does to it."
      },
      {
        q: "What was the biggest EDA finding about the taxi market?",
        a: "Flash Cab's dominance. Out of 64 companies, Flash Cab logged 19,558 rides on November 15–16, 2017 — nearly 71% more than the second-place company (Taxi Affiliation Services at 11,422). The field from #2 to #6 is fairly clustered (9,000–11,500 rides each), but none of them are close to Flash Cab. For market analysis, this kind of concentration matters: it suggests Flash Cab has structural advantages — fleet size, dispatch efficiency, or driver network — that competitors haven't replicated. The Loop and River North were the top two dropoff neighborhoods, reflecting Chicago's business district geography."
      },
      {
        q: "How did you structure the hypothesis test — what were H₀ and H₁?",
        a: "H₀ (null hypothesis): The average duration of Loop-to-O'Hare Saturday rides is the same regardless of weather conditions — bad weather has no effect. H₁ (alternative hypothesis): The average duration of those rides is longer in bad weather. Significance level α = 0.05, meaning I accept a 5% chance of falsely rejecting H₀ (Type I error rate). The alternative is one-directional — I'm specifically testing whether bad weather makes rides longer, not just whether it makes them different. Setting this up before analyzing the data is important: it prevents cherry-picking the hypothesis after seeing the result."
      },
      {
        q: "What is an independent two-sample t-test and why was it the right test here?",
        a: "An independent two-sample t-test compares the means of two separate, unrelated groups to determine whether the difference between them is statistically significant. 'Independent' means the two groups are distinct — no individual appears in both. Here: good-weather rides and bad-weather rides are different rides taken at different times. There's no pairing. A paired t-test would be wrong because paired tests require matched observations (same subject measured twice). A one-sample t-test would be wrong because I'm comparing two groups, not one group against a fixed target. The independent t-test is the correct choice."
      },
      {
        q: "What does a p-value of ≈ 0 actually mean?",
        a: "The p-value answers this specific question: if H₀ were true (no weather effect), what is the probability of observing a difference this large or larger purely by chance? A p-value of ≈ 0 means: if bad weather truly had no effect on ride duration, getting a t-statistic of 6.84 or higher purely from sampling variability would be essentially impossible. So we reject H₀ — the data is not consistent with 'no weather effect.' Important caveat: p-value does NOT measure the probability that H₀ is true, nor the probability that H₁ is true. It only tells you how surprising the observed result is under the assumption of H₀."
      },
      {
        q: "What does a t-statistic of 6.84 tell you?",
        a: "The t-statistic measures how many standard errors separate the two group means. t = 6.84 means the observed difference in means (bad weather minus good weather) is 6.84 times larger than the standard error of that difference. Practically: a t-statistic above ~2.0 at α = 0.05 is typically sufficient to reject H₀ with reasonable sample sizes. At 6.84, the signal is extremely strong — the observed difference is almost 7 standard errors away from zero. This is far beyond what you'd expect from random sampling variation. The high t-statistic is why the p-value is essentially zero."
      },
      {
        q: "Why did you remove the 6 rides with 0-second duration?",
        a: "A ride with 0 seconds duration is a data error — it's physically impossible to complete a Loop-to-O'Hare trip in zero seconds. Including these in the good-weather group would drag its mean downward, artificially inflating the apparent weather effect. The cleaning decision was made before computing any statistics — that order matters. If you explored the data, saw the means, then decided to remove outliers that 'improved' the result, you'd introduce selection bias. Cleaning first based on a principled rule (duration > 0) keeps the analysis legitimate. No bad-weather rides had this issue."
      },
      {
        q: "The bad-weather group only had 180 rides vs. 882 in the good-weather group. Is that a concern?",
        a: "The unequal sample sizes are worth noting but not a critical problem here. The t-test (Welch's variant via scipy.stats.ttest_ind) is robust to unequal group sizes — it adjusts the degrees of freedom accordingly. The bigger practical concern is whether 180 bad-weather rides is sufficient to draw conclusions. Given the t-statistic of 6.84 and the clear directional consistency of the data, 180 observations is more than enough to detect this effect. The effect would need to be much subtler for sample size to be a limiting factor here. If the bad-weather group had been, say, 20 rides, the robustness question would be more serious."
      },
      {
        q: "What's the difference between statistical significance and practical significance?",
        a: "Statistical significance asks: is this result unlikely to have occurred by chance? (p < α). Practical significance asks: does the size of the effect actually matter in the real world? These can diverge. With a huge sample, even a 1-second difference in means could be statistically significant — but completely irrelevant to a traveler's decision-making. Here, both dimensions align: the result is statistically significant (p ≈ 0) AND practically meaningful (+6.9 minutes, +20.6%). A 7-minute difference on a 30–40 minute airport trip affects whether passengers make their connections and how they plan their departure. Always report effect sizes alongside p-values — the number alone is not enough."
      },
      {
        q: "What visualizations did you create for the EDA and why?",
        a: "Two horizontal bar charts: one for top 10 taxi companies by ride volume, one for top 10 neighborhoods by average dropoffs. I chose horizontal bars specifically because the category labels (company names, neighborhood names) are long strings — vertical bars would require rotated labels that are hard to read quickly. Horizontal layout keeps labels left-aligned and easy to scan. Both charts used plt.gca().invert_yaxis() to place the highest-ranked category at the top, matching the natural reading direction (biggest first). For the hypothesis test, box plots and overlapping histograms showed the distribution differences between good and bad weather groups, making the visual gap between means immediately obvious before running any statistics."
      },
      {
        q: "What conclusion did you draw, and what did the result NOT prove?",
        a: "Conclusion: there is statistically significant evidence that bad weather increases the duration of Loop-to-O'Hare Saturday rides. t = 6.84, p ≈ 0, effect = +6.9 minutes (+20.6%). We reject H₀ at α = 0.05. What it did NOT prove: causation. The hypothesis test shows the two groups have significantly different means — it doesn't prove the mechanism. Bad weather might cause longer rides through slower traffic, more cautious driving, or higher demand overwhelming supply. Those are reasonable inferences from context, not conclusions drawn from the test itself. Rejecting H₀ means the data is inconsistent with 'no effect' — it doesn't tell us exactly how or why weather produces the effect."
      },
      {
        q: "How does this project differ from your ML projects (Sprint 8, Sprint 9)?",
        a: "Fundamentally different goal. ML projects (Sprint 8 and 9) are predictive: given features about a customer, predict their plan or their churn probability. This project is inferential: given data about taxi rides, draw a statistically valid conclusion about a population-level relationship. There's no model to train, no train/test split, no hyperparameters to tune. The output isn't a prediction — it's a decision (reject or fail to reject H₀) backed by a quantified confidence level. The discipline of setting up hypotheses before seeing results, choosing the right test for the data structure, and reporting effect sizes alongside p-values are skills that transfer directly into any analytical role, even one that never touches ML."
      },
      {
        q: "If you extended this project, what would you do next?",
        a: "Several directions: (1) Separate the weather effect by day of week or time of day — does bad weather affect early-morning rides differently than afternoon rides? (2) Test the same hypothesis for other high-traffic routes, not just Loop-to-O'Hare. If the weather effect is consistent across routes, it's structural. If it only shows up for the airport route, that's a different finding. (3) Use a Mann-Whitney U test as a non-parametric alternative — the t-test assumes roughly normal distributions, which the data approximates but doesn't guarantee. (4) Build a regression model predicting ride duration using weather, time of day, day of week, and route as features — moving from hypothesis testing to prediction."
      }
    ]
  }

  ,
  {
    id: "video-game-sales-analysis",
    title: "Video Game Sales Analysis",
    subtitle: "EDA & Hypothesis Testing · Market Analysis for Ice",
    institution: "TripleTen · Sprint 6 — Exploratory Data Analysis",
    year: "2025",
    type: "Data Analysis",
    description: [
      "Analyzed 16,715 historical video game records to identify the patterns that drive commercial success, building a data-backed 2017 advertising strategy for Ice, an online game retailer. Profiled platform life cycles, regional market preferences across NA, EU, and Japan, and the relationship between critic/user review scores and total sales.",
      "Ran two independent two-sample t-tests to validate platform and genre rating hypotheses — confirming that Xbox One and PC user ratings are statistically different (t = −4.67, p ≈ 0.000), while Action and Sports ratings are not (t = 1.79, p = 0.074). PS4 emerged as the dominant platform with 28.9% market share and 311M USD in sales across 2013–2016."
    ],
    tags: ["Python", "Pandas", "NumPy", "Matplotlib", "Seaborn", "SciPy", "EDA", "Hypothesis Testing", "t-test", "Market Analysis"],
    qa: [
      {
        q: "What was the business goal of this project?",
        a: "Ice is an online game retailer that needed to plan its 2017 advertising campaigns. The goal wasn't to build a predictive model — it was to use historical sales data (through 2016) to answer: which platforms and genres are worth advertising on? Which regions should get different campaign strategies? Do critic or user review scores actually predict commercial success? And are there statistically significant differences in how players rate games across platforms and genres? Every analytical choice was oriented toward producing findings that could drive a real advertising decision."
      },
      {
        q: "Why did you use 2013–2016 as the analysis window instead of the full dataset?",
        a: "The dataset spans 1980–2016. Using data from 1985 or even 2005 to predict 2017 behavior would introduce systematic bias — the gaming landscape in those years bears almost no resemblance to the modern market. PS1 and SNES-era patterns don't tell you anything about PS4 purchasing behavior. I analyzed total sales by year and found: sales grew sharply from 2001, peaked around 2006–2009, then declined as mobile gaming and digital distribution disrupted physical retail. By 2013, the market had settled into a smaller, modern set of active platforms (PS4, Xbox One, 3DS, PC). Using 2013–2016 captures a complete modern platform generation cycle — relevant to 2017 without being polluted by outdated dynamics."
      },
      {
        q: "PS4 had a mean sale of 0.82M but a median of 0.20M per game. What does that gap tell you?",
        a: "The gap tells you the distribution is heavily right-skewed — a small number of blockbuster titles (Grand Theft Auto V, FIFA, Call of Duty) are pulling the mean far above what a typical PS4 game earns. Most PS4 games sold around 0.20M USD or less. The median is the more representative number for a 'typical' game on the platform. For business decisions: if you're allocating advertising dollars, the mean is misleading — it suggests a typical PS4 game earns 0.82M when most earn far less. The median grounds expectations in reality. Any time a mean significantly exceeds the median, you have positive skew, and you should prefer the median as a measure of central tendency."
      },
      {
        q: "Critic Score correlated +0.31 with sales. User Score correlated ≈ 0.00. Why the difference?",
        a: "Several factors explain the divergence: (1) Selection bias in user scores — users who take the time to rate games are not representative of all buyers. They skew toward enthusiasts who are more likely to rate games they have strong opinions about (very good or very bad), creating noise. (2) Review bombing — user scores are vulnerable to coordinated low-rating campaigns that have nothing to do with the game's commercial quality. (3) Timing — critic scores often precede launch and influence purchasing decisions; user scores accumulate post-purchase and reflect satisfaction, not purchase intent. (4) Volume — critic scores are aggregated from professional outlets with editorial standards; user scores are individual, unvetted. A +0.31 critic score correlation is moderate but meaningful for a noisy industry — it's actionable. User scores are not."
      },
      {
        q: "Japan's market looked very different from NA and EU. What were the key differences?",
        a: "Three major differences: (1) Genre: Role-Playing games held 30.32% market share in Japan — nearly double the Action share in Japan, and far above RPG's share in NA or EU. NA and EU were dominated by Action, Sports, and Shooter, which together exceeded 50% in both regions. (2) Platform: Japan showed strong preference for handheld platforms — the Nintendo 3DS was a top performer, while it barely registered in NA/EU where console gaming (PS4, Xbox One) dominated. (3) Market structure: the Xbox brand barely exists in Japan — it's a PlayStation and Nintendo market. A retailer running the same campaign in Japan as in NA would be misallocating spend significantly. Japan requires a separate strategy: RPG-heavy with handheld-first platform focus."
      },
      {
        q: "How did you structure the hypothesis tests — what were H₀ and H₁ for each?",
        a: "Test 1 (Xbox One vs. PC): H₀ = average user ratings for Xbox One and PC are equal; H₁ = they are different. Two-tailed test. Test 2 (Action vs. Sports): H₀ = average user ratings for Action and Sports games are equal; H₁ = they are different. Two-tailed test. Both at α = 0.05. Critically: I stated both hypotheses before computing anything. This matters because if you look at the data, notice a difference, and then run a test to confirm it, you're performing hypothesis testing in bad faith — fitting the question to the answer rather than the other way around. The formal setup (H₀, H₁, α, then compute) is the methodological discipline that makes the result meaningful."
      },
      {
        q: "What did you find in Hypothesis 1 (Xbox One vs. PC ratings), and what does it mean?",
        a: "Result: t = −4.6711, p ≈ 0.0000. We reject H₀ at α = 0.05. There is statistically significant evidence that Xbox One and PC players rate games differently on average. The negative t-statistic means Xbox One ratings were lower on average than PC ratings in the dataset. Practically: this finding matters for a retailer because it means user ratings are not platform-agnostic. A game with a 7.5 user score on Xbox One is not directly comparable to a 7.5 on PC — those numbers reflect different player communities with different expectations, game libraries, and rating behaviors. Platform should be a moderating variable in any analysis using user scores."
      },
      {
        q: "What did you find in Hypothesis 2 (Action vs. Sports ratings), and what does it mean?",
        a: "Result: t = 1.7894, p = 0.0737. We fail to reject H₀ at α = 0.05. There is no statistically significant difference between average user ratings for Action and Sports games. This is a meaningful negative result: it challenges the assumption that genre drives user satisfaction. Players don't systematically rate Action games higher or lower than Sports games on average. For advertising: this means genre label alone is not a reliable proxy for expected user satisfaction. Marketing should focus on game-specific features, visuals, franchise recognition, and critic reception rather than assuming genre determines how well a game will be received."
      },
      {
        q: "What is the difference between failing to reject H₀ and proving H₀ is true?",
        a: "Failing to reject H₀ does not mean H₀ is true — it means the data doesn't provide sufficient evidence to conclude H₁ is true. There's a fundamental asymmetry in hypothesis testing: we can accumulate evidence against H₀ (reject it), but we cannot prove it. With p = 0.0737 (just above α = 0.05), the result is 'fail to reject' — but this could mean: the difference truly doesn't exist, or the sample size wasn't large enough to detect a real but small difference, or the α threshold was set conservatively. A larger dataset might yield a significant result for Action vs. Sports. Null results should be reported honestly rather than spun as 'we proved they're equal.'"
      },
      {
        q: "What data cleaning challenges did you face?",
        a: "Three main issues: (1) User Score was stored as a string with 'tbd' (to be determined) for unscored games. I replaced 'tbd' with NaN and converted the column to float using pd.to_numeric(errors='coerce'). Failing to handle this would cause the entire column to be treated as object dtype, making numerical operations impossible. (2) Year of Release had missing values and was stored as float — I converted it to nullable integer using pd.to_numeric(errors='coerce'). (3) Three columns had substantial missing data: Critic Score (~51% missing), User Score (~40%), Rating (~40%). Rather than imputing, I ran score-dependent analyses only on records where the score existed, and clearly flagged the coverage limitation in findings."
      },
      {
        q: "Why did you calculate total_sales rather than using regional sales directly?",
        a: "Total_sales provides a single unified measure of a game's commercial performance — necessary for ranking platforms, genres, and individual titles. Regional breakdown (NA, EU, JP, Other) was preserved for regional profiling, but comparing games across all markets requires a common denominator. Summing NA + EU + JP + Other gives total global physical sales. This also naturally handles the fact that some games are released only in certain regions — they show zeros in non-release markets, which correctly weighs down their global total relative to worldwide releases."
      },
      {
        q: "What were your top recommendations for Ice's 2017 advertising campaigns?",
        a: "Five prioritized recommendations: (1) Concentrate PS4 and Xbox One campaigns in NA and EU — these platforms dominate both markets, and Action/Sports/Shooter genres have the strongest commercial track record there. (2) Build a separate Japan strategy centered on 3DS and RPG titles — the same campaign that works in NA will underperform in Japan's distinct market. (3) Prioritize multi-platform titles in advertising spend — games like GTA V that released across multiple platforms consistently reach larger audiences and outsell exclusives. (4) Feature critic scores prominently in product pages and promotions — there's a meaningful r = +0.31 correlation with sales; user scores have none. (5) Target E and T-rated titles for broadest reach — ESRB E-rated games had the highest total sales volume; M-rated titles have a loyal but smaller addressable market."
      },
      {
        q: "How does this project differ from your ML projects (Sprints 8 and 9)?",
        a: "Fundamentally different goal. Sprint 8 (Megaline) and Sprint 9 (Churn) are predictive: given features about a customer, output a classification. There's a target variable, a train/test split, and a numeric performance metric. This project is analytical and inferential: given sales data, understand the market structure and test specific hypotheses. There's no model to train, no validation set, no F1 score. The output is a set of justified business recommendations and two statistical decisions (reject/fail to reject). The discipline here — choosing the right time window, building regional profiles, structuring hypotheses before computing, reporting effect sizes alongside p-values — transfers directly into any data analyst or business intelligence role."
      }
    ]
  }

  ,
  {
    id: "specright-apache-spark",
    title: "Specification Management App Powered by Apache Spark",
    subtitle: "Big Data Architecture · Apache Spark, Amazon EMR & AWS EC2",
    institution: "Georgia Tech CS 6675 — Big Data Systems & Analytics",
    year: "2024",
    type: "Final Project",
    description: [
      "Designed a prototype that enhances Specright — a leading specification management platform — with Apache Spark as a Big Data processing backend for Innovation First's VEX Robotics competition product line. Analyzed 85 real customer reviews to identify computing performance gaps, then benchmarked Sort Rate (TB/min) and Runtime (seconds) across Apache Spark, Hadoop MapReduce, and Amazon EMR on three EC2 instance types.",
      "Built a combined efficiency rubric (Sort Rate + Runtime) and determined that Specright on Amazon EMR 5.28 with a c4.8xlarge EC2 instance is the most efficient configuration — HIGH sort rate and LOW runtime (169.41 seconds). Completed April 20, 2024."
    ],
    tags: ["Apache Spark", "PySpark", "Amazon EMR", "AWS EC2", "CloudWatch", "Big Data", "Hadoop MapReduce", "Agile", "Python"],
    qa: [
      {
        q: "What is Apache Spark and how is it different from Hadoop MapReduce?",
        a: "Apache Spark is a distributed Big Data processing engine that processes data in-memory across a cluster of nodes. Hadoop MapReduce is its predecessor — it writes intermediate results to disk between each map and reduce step, which makes it dramatically slower. Spark keeps data in RAM throughout the computation, making it 10–100x faster than MapReduce for iterative workloads. The 2014 Daytona GraySort benchmark made this concrete: Spark sorted 100 TB using 206 nodes in 23 minutes, while MapReduce sorted 102.5 TB using 2,100 nodes in 72 minutes. Fewer nodes, faster results, lower resource cost — that's the Spark advantage."
      },
      {
        q: "What is Specright and why did it need Apache Spark?",
        a: "Specright is a specification management platform built on Salesforce and hosted on AWS. It lets companies digitize and manage all their product specifications (specs) and SKUs in one place. It earned 4.5 out of 5 stars from users, so overall it's a solid product. But when I analyzed 85 real customer reviews, I found a recurring cluster of complaints around Computing Speed, Conga Batch Function Issues, and Data Limits — all pointing to the same root cause: the platform struggles when data volumes get large. Apache Spark addresses exactly that — it was designed for processing massive datasets efficiently. That's why the enhancement made sense."
      },
      {
        q: "What metrics did you use to evaluate Big Data platform performance?",
        a: "Two metrics: Sort Rate and Runtime. Sort Rate (TB/min) measures how much data a platform can sort per minute — it tells you about throughput. Runtime (seconds) measures how long the overall job takes to complete — it tells you about execution speed. Used alone, each metric is incomplete. A HIGH sort rate but HIGH runtime means you can move a lot of data but it takes too long. A LOW runtime but LOW sort rate means you finish quickly but aren't actually processing enough data to be useful. The most efficient configuration is HIGH sort rate AND LOW runtime together. I built a 2x2 efficiency rubric — Very Efficient, Inefficient (two variants), and Extremely Inefficient — to categorize every scenario."
      },
      {
        q: "Which EC2 instance type performed best and why?",
        a: "The c4.8xlarge was the best-performing instance type. It's a current-generation Compute-Optimized EC2 instance — AWS built it specifically for science and engineering workloads like web servers, high-performance computing, and batch processing. Apache Spark on c4.8xlarge achieved a Sort Rate of 5.56 TB/min, the highest of all configurations I tested. The older instance types (m3.2xlarge and i2.8xlarge) are previous-generation instances — they were relevant in 2013-2014 when the Spark vs. MapReduce benchmarks were run, but they're not the right choice for a new deployment. The lesson: choose compute that's purpose-built for your workload type, and don't use outdated instances when current-generation options exist."
      },
      {
        q: "What is Amazon EMR and why did you add it to the analysis?",
        a: "Amazon EMR (Elastic MapReduce) is AWS's managed cluster platform for running Big Data frameworks like Apache Spark and Hadoop MapReduce. Instead of manually provisioning EC2 instances and configuring Spark yourself, EMR handles cluster setup, scaling, and optimization automatically. I added EMR to the Design Refinement phase because it can enhance Spark performance further — EMR 5.28 (a newer version) has significant runtime improvements over EMR 5.16. In the referenced AWS study, EMR 5.28 completed in 169.41 seconds vs EMR 5.16's 427.68 seconds — a 2.5x speedup. When I applied the efficiency rubric, Specright on EMR 5.28 was the only configuration that achieved 'Very Efficient' (HIGH sort rate + LOW runtime)."
      },
      {
        q: "Walk me through the architecture of your prototype design.",
        a: "Innovation First's software development team first gathers all VEX IQ and VEX V5 competition product specs and SKUs — from physical binders to email attachments to ERP data — and imports them into the Specright platform. From there, both the Specright API and the Apache Spark API (via PySpark) run together on an AWS EC2 instance. The Specright API processes and analyzes specs and SKUs for the sales and manufacturing departments. Apache Spark handles the heavy data sorting and processing underneath. Amazon CloudWatch monitors the EC2 instance to measure Sort Rate and Runtime in real time. The results from CloudWatch feed back to the software development team, who use them to make deployment decisions. That CloudWatch monitoring loop is how you get continuous, consistent performance data rather than one-time benchmarks."
      },
      {
        q: "What is PySpark and why was it used?",
        a: "PySpark is the Python API for Apache Spark. Spark is written in Scala, but PySpark lets you write Spark applications in Python — which is the dominant language for data science and engineering work. Using PySpark meant I could write the Specright API integration in Python (with the requests library for HTTP calls) and also initialize and control the Spark processing engine in the same language. The high-level code outline initialized the Big Data Platform API with PySpark, initialized the Specright API, defined functions to process VEX competition specs and SKUs, defined analysis functions for the sales and manufacturing departments separately, and defined a function to measure Sort Rate (or Runtime in the Design Refinement phase)."
      },
      {
        q: "What is Amazon CloudWatch and how was it used in this project?",
        a: "Amazon CloudWatch is AWS's monitoring and observability service. It collects metrics, logs, and events from AWS resources in real time — you can set alarms, create dashboards, and analyze performance trends. In this project, CloudWatch was the measurement tool: as Specright ran on the EC2 instance with Apache Spark, CloudWatch captured the Sort Rate and later the Runtime of each configuration. This is how you'd collect empirical performance data in production rather than relying on theoretical benchmarks. CloudWatch can also generate graphs showing performance over time, which is useful for continuous monitoring rather than just one-time measurement."
      },
      {
        q: "How did you use customer reviews as part of your engineering process?",
        a: "I analyzed 85 real customer reviews from G2.com for the Specright platform. For each review, I went through the 'What do you dislike about Specright?' response and categorized every complaint. I tallied 63 total complaint instances across 18 categories. The top categories included UI Problems (15), Implementation Problems (12), Computing Speed (5), Platform is Too Complex (5), and Searching for Information (5). I highlighted four categories in yellow as the focus for Apache Spark enhancement: Computing Speed, Conga Batch Function Issues, Data Limits/Unnecessary Data, and Implementation Problems. All four point to performance and scalability issues that a Big Data processing layer can address. Starting with real user feedback to define the engineering problem is something I find much more grounding than starting with a technology and looking for a use case."
      },
      {
        q: "What was Design Refinement Scenario 4 and why was it the most likely?",
        a: "Scenario 4 used the c4.8xlarge EC2 instance type and showed EMR 5.16 performing better than all non-EMR configurations, with EMR 5.28 performing even better than EMR 5.16. Non-EMR options (No Big Data Platform, Apache Spark standalone, Hadoop MapReduce) all had significantly longer runtimes (500–700 seconds) compared to EMR 5.28's 169.41 seconds. I flagged Scenarios 1, 2, and 3 as highly unlikely because in those scenarios non-EMR configurations performed better than EMR — which contradicts the purpose of EMR. EMR should improve on raw Spark by adding managed optimization. Scenario 4 is the most realistic because: (1) c4.8xlarge is the right instance type for this workload, (2) EMR 5.28's speed advantage over EMR 5.16 is real and documented, and (3) running Spark or MapReduce without EMR's managed optimizations should indeed be slower."
      },
      {
        q: "What is the difference between Virtual Machines and Docker containers? Which would you use next?",
        a: "Virtual Machines (VMs) divide a physical server using a hypervisor — each VM gets its own Guest Operating System, its own copy of the OS kernel, libraries, and runtime. This means VMs are heavier: each one can be gigabytes in size and takes minutes to boot. Docker containers share the host OS kernel — they only package the application and its dependencies, not a full OS. This makes containers much lighter (megabytes, not gigabytes), faster to start (seconds, not minutes), and more efficient per physical server. In this project I used EC2 instances (VMs). In my next design iteration, I would move to Docker containers — likely running on AWS ECS (Elastic Container Service) or EKS (Elastic Kubernetes Service). The hypothesis is that the container overhead reduction would improve runtime further. I'd measure that with CloudWatch using the same Sort Rate + Runtime rubric."
      },
      {
        q: "What is Agile and how did you apply it to this project?",
        a: "Agile is a project management framework built around iterative development, continuous measurement, and adapting based on findings rather than following a rigid plan. I structured the project using three Agile concepts: Initiative (the high-level business goal — boost the business of Innovation First), Epic (the technical task — enhance Specright with Apache Spark), and User Story (the specific end-user need — sales and manufacturing teams at Innovation First need access to a high-performing Specright platform). The iterative structure played out naturally: I started with a Baseline Design measuring Sort Rate, then moved to Design Refinement adding Runtime and EMR, then built an Evaluation Plan combining both metrics, and finally executed it and reported results. Each phase informed the next — that's Agile in practice."
      },
      {
        q: "If you could extend this project further, what would you do?",
        a: "A few directions: (1) Move to Docker containerization — test whether container-based deployment of Spark and Specright on ECS or EKS improves runtime over the VM approach, measuring with the same Sort Rate + Runtime rubric. (2) Write actual PySpark code — this project designed the architecture and produced reasoned mock data; the natural next step is to implement the Python functions I outlined and run them against real data. (3) Expand the customer review analysis — 85 reviews is a reasonable sample, but running sentiment analysis or topic modeling across a larger corpus would surface patterns that manual categorization might miss. (4) Test with real VEX Robotics SKU data — Innovation First's actual catalog would let you validate whether the performance projections hold at real data volumes."
      }
    ]
  }

  // ── Future projects will be added here ──────────────────────

  ,
  {
    id: "house-price-api",
    title: "House Price Prediction API",
    subtitle: "Model Deployment · FastAPI & Pydantic",
    institution: "TripleTen · Sprint 11 — Model Deployment",
    year: "2026",
    type: "ML Engineering Project",
    description: [
      "Deployed a trained Random Forest regressor as a production-ready REST API using FastAPI and Pydantic — with schema-validated inputs, startup-loaded model, and correct HTTP status codes.",
      "Iteratively refined through three rounds of reviewer feedback, resolving all issues before final acceptance. Demonstrates ML engineering skills beyond the notebook."
    ],
    tags: ["Python", "FastAPI", "Pydantic", "REST API", "Random Forest", "Model Deployment", "Swagger UI"],
    qa: [
      {
        q: "How did you deploy a machine learning model as a service?",
        a: "Situation: A trained Random Forest regressor needed to be accessible via HTTP — not just as a notebook but as a service that could validate inputs and return structured predictions. Task: Build a production-ready FastAPI application with health monitoring, model introspection, and a prediction endpoint. Action: (1) Defined Pydantic schemas first — HousePredictionRequest with all 13 feature constraints, typed response models for each endpoint. (2) Loaded the model once at startup using @app.on_event('startup') — stored in a global variable for efficient reuse. (3) Maintained feature ordering using metadata['features'] — the exact column order from training, guaranteed consistent. (4) Implemented 503 error handling when the model isn't loaded, 500 for unexpected inference failures. (5) Iteratively refined through three rounds of reviewer feedback. Result: A documented REST API with auto-generated Swagger UI, typed schemas, and health monitoring."
      },
      {
        q: "What HTTP status codes did you use and why?",
        a: "200 OK: Successful GET requests (/health, /model/info) and successful predictions (/predict). 422 Unprocessable Entity: FastAPI/Pydantic returns this automatically when input validation fails — e.g., a feature value outside its valid range. 503 Service Unavailable: Model not loaded — the service exists but can't fulfill the request. Semantically correct for a startup failure scenario. 500 Internal Server Error: Unexpected inference failures — the model loaded but something went wrong during prediction. Choosing 503 over 500 for the 'model not loaded' case was deliberate — 503 signals a recoverable, operational issue (retry later), while 500 signals an unexpected bug."
      }
    ]
  }

  ,
  {
    id: "langchain-bedrock-models",
    title: "Calling Bedrock Models with LangChain",
    subtitle: "LangChain · ChatBedrock · Prompt Templates · Stateful Chatbot",
    institution: "AWS Cloud Institute",
    year: "2026",
    type: "Applied Project",
    description: [
      "Used LangChain to invoke Amazon Bedrock models — comparing boto3 vs. ChatBedrock, building prompt templates, parsing structured output, and developing a stateful context-aware chatbot for AMusicVenue staff scheduling.",
      "Demonstrated model portability, PromptTemplate reuse, CommaSeparatedListOutputParser for structured output, and per-turn cost tracking via usage_metadata."
    ],
    tags: ["Python", "LangChain", "Amazon Bedrock", "ChatBedrock", "PromptTemplate", "CSVLoader", "Message History", "AWS"],
    qa: [
      {
        q: "What is LangChain and why use it instead of boto3 directly?",
        a: "LangChain is an open-source framework for building applications powered by large language models. It provides high-level abstractions over low-level model APIs — handling request formatting, response parsing, conversation history, and component composition. Why use it over raw boto3: (1) Less boilerplate — a boto3 invocation requires constructing a JSON payload, encoding it, calling invoke_model(), decoding the response body, and navigating nested keys. LangChain reduces this to nova_llm.invoke([('human', prompt)]) returning a clean Python object. (2) Model portability — switching between Claude, Nova, and GPT-4 is a one-line model ID change. (3) Composability — prompts, models, and parsers can be chained: prompt | model | parser. (4) Built-in primitives — message types, streaming, memory, document loaders, and output parsers are production-ready components. From the project: the same boto3 invocation took 7 lines of nested JSON construction and key extraction. The LangChain equivalent took 3 lines with cleaner output."
      },
      {
        q: "What is ChatBedrock and how does it differ from the boto3 bedrock-runtime client?",
        a: "ChatBedrock (from langchain_aws) is LangChain's high-level chat model wrapper for Amazon Bedrock. It implements the standard LangChain BaseChatModel interface, accepting structured message objects and returning an AIMessage with a clean .content string. Key differences from boto3: (1) Input format — boto3 requires model-specific JSON payload construction; ChatBedrock accepts LangChain's unified message format. (2) Output format — boto3 returns a raw JSON blob requiring chained key extraction; ChatBedrock returns an AIMessage object where response.content is the text. (3) Composability — ChatBedrock works natively with LangChain's chain syntax, prompt templates, and output parsers; boto3 does not. (4) Streaming — ChatBedrock exposes .stream() out of the box; boto3 requires invoke_model_with_response_stream() with manual chunk iteration."
      },
      {
        q: "What are PromptTemplates and why are they better than f-strings?",
        a: "PromptTemplates separate the structure of a prompt from its variable inputs, similar to how SQL prepared statements separate query structure from query parameters. Why they're better than f-strings for LLM work: (1) Reusability — the same template runs against any number of inputs. In the project, one template generated three purchase orders (soda, napkins, receipt paper) by looping over a list of order dictionaries. (2) Composability — ChatPromptTemplate works directly in LangChain chains (prompt | model | parser) without additional glue code. (3) Format instructions — output parsers inject their required format instructions automatically via {format_instructions}. (4) Versionability — templates are objects that can be stored, loaded, and versioned independently of the calling code. From the project: a PromptTemplate with {product}, {supplier}, {quantity}, and {price} variables was called in a loop — generating each purchase order without any duplicate prompt engineering."
      },
      {
        q: "How do output parsers work and what problem do they solve?",
        a: "LLM output is always a string. Applications often need structured data — a Python list, a JSON object, a boolean, a typed model. Output parsers handle the conversion. How they work: (1) The parser's get_format_instructions() method returns a string telling the model exactly how to format its output. (2) That instruction string is injected into the prompt via a {format_instructions} variable. (3) After the model responds, the parser's .parse() method converts the string into the target type. From the project: CommaSeparatedListOutputParser converted the model's comma-separated ingredient substitutions into a Python list — ready for direct use in application logic, no custom string parsing needed."
      },
      {
        q: "How did you add statefulness to the chatbot?",
        a: "LLMs are stateless — every invocation is independent. Statefulness is an application-layer concern implemented by maintaining a message history list. The pattern: (1) Initialize the list with a SystemMessage defining the assistant's role. (2) On each user turn: append a HumanMessage to the list. (3) Invoke the model with the full list (not just the latest message). (4) Append the model's response as an AIMessage to the list. (5) Repeat — the list grows with each exchange. Why it works: the model sees the complete conversation on every invocation. A follow-up like 'Can they swap shifts?' resolves correctly because the names and days from earlier turns are present. Cost implication: input token count grows with each turn as history accumulates. response.usage_metadata was used to calculate per-turn cost — a real operational consideration for long sessions."
      },
      {
        q: "How did you inject document context using CSVLoader?",
        a: "LangChain's CSVLoader (from langchain_community) loads a CSV file and returns a list of Document objects — one per row — each with a page_content string containing the row data. Implementation: (1) Load the shifts CSV: loader = CSVLoader(file_path='shifts.csv'); docs = loader.load(). (2) Convert to a single string: shifts_string = '\\n'.join([doc.page_content for doc in docs]). (3) Inject into the system message: embed shifts_string directly into the SystemMessage content as structured context. Why this approach: for small structured datasets like a weekly shift schedule, injecting the full document as context is simpler and faster than building a full RAG pipeline with embeddings and vector search. Tradeoff: this is 'context stuffing' — it works for small docs but doesn't scale to large corpora where vector retrieval becomes necessary."
      }
    ]
  }

  ,
  {
    id: "rag-bedrock-knowledge-base",
    title: "RAG with Amazon Bedrock Knowledge Bases",
    subtitle: "S3 → Titan Embeddings → OpenSearch Serverless → Nova Lite",
    institution: "AWS Cloud Institute",
    year: "2026",
    type: "Applied Project",
    description: [
      "Built an end-to-end RAG pipeline on Amazon Bedrock: S3 data source → Titan Text Embeddings v2 → OpenSearch Serverless vector store → Nova Lite → RetrieveAndGenerate API.",
      "System answers questions grounded in 6 internal AnyCompany documents with full source citations — compared against LLM-only responses to demonstrate quality difference."
    ],
    tags: ["Python", "Amazon Bedrock", "RAG", "OpenSearch Serverless", "Titan Embeddings", "boto3", "Vector Store", "AWS"],
    qa: [
      {
        q: "What is RAG and why is it important for enterprise AI?",
        a: "RAG (Retrieval Augmented Generation) enhances LLM responses by retrieving relevant context from an external knowledge source and injecting it into the prompt before generation. Why it matters: (1) LLMs have a knowledge cutoff — they can't answer questions about data created after training, or about proprietary internal documents. (2) Fine-tuning is expensive and requires retraining whenever data changes — RAG provides dynamic, up-to-date context without retraining. (3) Responses are grounded in source documents with traceable citations — critical for enterprise trust and auditability. From the project: an LLM queried directly about AnyCompany's products returned generic answers. The same query routed through the knowledge base retrieved actual product specs from internal documents and generated a grounded, accurate response."
      },
      {
        q: "What are vector embeddings and how do they enable semantic search?",
        a: "Embeddings are dense numerical vectors that encode the semantic meaning of text. Words or passages with similar meaning have vectors that are close together in high-dimensional space. How semantic search works: (1) At ingestion — each document chunk is converted to an embedding vector and stored in a vector database. (2) At query time — the query is converted to an embedding using the same model. (3) The vector database returns the chunks whose embeddings are most similar to the query vector (approximate nearest-neighbor search). (4) Similarity is measured by cosine similarity or dot product — not keyword overlap. In the project: Amazon Titan Text Embeddings v2 converted both document chunks and incoming queries into vectors. OpenSearch Serverless stored and indexed those vectors, returning the most semantically relevant chunks for each query — even when the wording didn't match exactly."
      },
      {
        q: "What is a vector database and how does it differ from a traditional database?",
        a: "A vector database is optimized to store, index, and query high-dimensional embedding vectors using approximate nearest-neighbor (ANN) algorithms. Traditional DB: exact matches on structured fields (WHERE customer_id = 123) — fast for exact lookups, useless for semantic similarity. Vector DB: similarity search over dense vectors — 'find the 5 chunks most semantically similar to this query embedding.' Inexact by design, but orders of magnitude faster than brute-force comparison. In the project: OpenSearch Serverless served as the vector store with a bedrock-knowledge-base-default-index. The same role is played by Pinecone, Weaviate, Qdrant, Milvus, or pgvector in custom RAG stacks — the underlying concept is identical across all of them."
      },
      {
        q: "Walk me through the RAG pipeline you built end-to-end.",
        a: "Situation: AnyCompany's customer support VP needed a POC chat app that could answer questions using 6 internal documents — product descriptions, support tickets, CSAT data, sales records, and an investor summary. Pipeline steps: (1) Data ingestion — uploaded 6 files (CSV + TXT) to an S3 bucket via AWS CLI. (2) Knowledge base creation — created an Amazon Bedrock Knowledge Base pointing to the S3 bucket, with Titan Text Embeddings v2 as the embedding model and OpenSearch Serverless as the vector store. (3) Sync — triggered a sync; Bedrock chunked each document, generated embeddings, and wrote the vectors to the OpenSearch index. (4) Console testing — validated RAG responses via the Bedrock test panel, same questions asked with and without the knowledge base to confirm quality difference. (5) API access — queried the knowledge base programmatically using bedrock-agent-runtime boto3 client and the retrieve_and_generate() method. Result: the system answered AnyCompany-specific questions that an LLM without RAG could not answer — all with source citations pointing back to the S3 documents."
      },
      {
        q: "When would you use RAG vs. fine-tuning an LLM?",
        a: "Use RAG when: you need the model to answer questions about specific, frequently updated documents; the knowledge changes often (new support tickets, updated product specs); you need traceable source citations; you want to avoid retraining costs and delays. Use fine-tuning when: you want the model to adopt a specific tone, format, or reasoning style; the task requires specialized domain knowledge baked into the model weights (e.g., medical diagnosis, legal reasoning); latency constraints prevent injecting large context windows at query time. The practical reality: most enterprise AI deployments start with RAG because it's faster, cheaper, and more maintainable than fine-tuning. Fine-tuning is reserved for behavior and style changes, not knowledge injection."
      },
      {
        q: "What is the RetrieveAndGenerate API and what does its response structure tell you?",
        a: "The retrieve_and_generate() method on the bedrock-agent-runtime boto3 client performs the full RAG pipeline in a single API call — retrieval + generation — and returns a structured JSON response. Key response fields: output.text (the generated answer — what you'd show the user); citations[].generatedResponsePart.textResponsePart.text (the specific span of generated output grounded by a retrieved chunk); citations[].retrievedReferences[].content.text (the raw chunk of text retrieved from the knowledge base); citations[].retrievedReferences[].location.s3Location.uri (the S3 URI of the source document — full auditability); sessionId (pass it back in subsequent calls to maintain multi-turn conversation context). The sessionId is what makes follow-up questions like 'Were most of those issues resolved?' work — it links the new query to the prior conversation."
      },
      {
        q: "What happens during a knowledge base sync and why is it required?",
        a: "A sync processes the raw documents in the S3 bucket into queryable vector embeddings: (1) Chunking — documents are split into smaller text segments to fit within the embedding model's input limit and maximize retrieval precision. (2) Embedding — each chunk is passed through the embedding model (Titan Text Embeddings v2) to produce a dense vector representation. (3) Indexing — the vectors are written to the vector store (OpenSearch Serverless) alongside the original chunk text and source metadata. Why it's required after every data update: the knowledge base doesn't automatically monitor S3 for changes. If you add, update, or delete documents in the bucket, you must trigger a re-sync manually (or via automation) for the vector index to reflect the new state. Until then, queries return results based on the old index."
      }
    ]
  }

  ,
  {
    id: "instacart-eda",
    title: "Instacart Customer Behavior EDA",
    subtitle: "EDA · 4.5M Records · Multi-file Data Merging",
    institution: "TripleTen · Sprint 2",
    year: "2025",
    type: "EDA Project",
    description: [
      "Cleaned and analyzed 4.5M order-product records from Instacart's 2017 Kaggle dataset across five CSV files — removing duplicates, resolving two structurally different missing value cases, and merging all five files into a unified dataframe.",
      "Surfaced peak shopping hours (9AM–4PM), busiest days (Sunday 84K orders), bimodal reorder gaps (7 and 30 days), and top reordered item (Banana: 557,763 reorders) across 206K customers."
    ],
    tags: ["Python", "Pandas", "Matplotlib", "Jupyter", "EDA", "groupby", "Missing Value Strategy"],
    qa: [
      {
        q: "Describe an EDA project where you had to handle multiple data quality issues.",
        a: "Situation: Instacart's 2017 Kaggle dataset contained five interconnected CSV files representing orders, products, aisles, departments, and order-product pairs — with a total of 4.5M order-product records. The data had quality issues across multiple dimensions. Task: Preprocess the data to a clean, analyzable state and then surface behavioral insights about customer shopping patterns. Action: (1) Removed 15 duplicate order records using drop_duplicates() on the orders dataframe. (2) Found 1,258 missing product names — traced all of them to aisle 100 / department 21, which Instacart labels 'missing.' Filled with 'Unknown' rather than dropping, since the orders themselves were valid. (3) Found 836 missing add_to_cart_order values — confirmed they only appeared in orders with 65+ items, likely a data capture ceiling. Left as NaN since imputing arbitrary cart positions would be misleading. (4) Merged all five files into a unified dataframe. (5) Used groupby aggregations to surface shopping hour distributions, day-of-week patterns, reorder gap distributions, and top reordered products. Result: clean, merged dataset enabling full behavioral analysis. Each missing value decision was justified by root-cause investigation — not a blanket drop or fill strategy."
      },
      {
        q: "How do you decide whether to fill or drop missing values?",
        a: "The decision depends on what the missing value means and how it will be used downstream — not just the percentage missing. In the Instacart project, I had two different missing value situations requiring two different strategies: (1) 1,258 missing product names — all were from aisle 100 / department 21, Instacart's internal label for missing/unlisted products. The orders were real; the products just weren't named. Filling with 'Unknown' was correct because dropping would have removed valid order records from the analysis. (2) 836 missing cart positions (add_to_cart_order) — all appeared in orders with 65+ items. Instacart likely had a capture ceiling — cart positions above 65 weren't recorded. Leaving them as NaN was correct because any value I invented would be fabricated data, not a reasonable imputation. General rule: investigate why values are missing before deciding. Missing at random → impute or drop based on volume. Missing not at random → understand the mechanism first. Structured missingness → preserve it."
      },
      {
        q: "What behavioral patterns did you find, and how would they inform a product decision?",
        a: "Key findings: Peak shopping hours are 9AM–4PM, peaking around 10AM–11AM, dropping sharply after 8PM. Busiest days are Sunday (84,090 orders) and Monday (82,185) — weekends are the primary restocking days. Reorder gap distribution is bimodal — large spike at 7 days (44,577 orders) and 30 days (51,337). Customers either shop weekly or monthly. Top reordered item is Banana (product_id 24852, 557,763 reorders) — fresh produce dominates repeat purchases. Product implications: (1) Schedule push notifications for Sunday morning — highest reach window for re-engagement. (2) Weekly shoppers (7-day gap cluster) are the highest-frequency segment — targeting them with loyalty incentives has the highest ROI. (3) Fresh produce is the anchor category — a stockout on bananas has outsized impact on customer satisfaction."
      }
    ]
  }

  ,
  {
    id: "vex-ai-robotics",
    title: "VEX AI Robotics Competition Enhancement",
    subtitle: "SpotFi Localization · RGB-D 3D Mapping · P2P Coordination",
    institution: "Georgia Tech CS6675 · Spring 2024",
    year: "2024",
    type: "Research Paper",
    description: [
      "Proposed a layered AI system architecture to address the VEX AI Robotics system's critical limitations — the Sensor Fusion Map's forward-only visibility and lack of Z-axis awareness during the elevation scoring phase.",
      "Designed SpotFi WiFi localization + Intel RealSense RGB-D cameras as a baseline, then a P2P decentralized coordination layer using V5 Radio for real-time data sharing across all four robots' NVIDIA Jetson Nano processors."
    ],
    tags: ["AI Architecture", "Sensor Fusion", "Edge AI", "NVIDIA Jetson Nano", "SpotFi", "RGB-D", "P2P Networking", "Robotics"],
    qa: [
      {
        q: "Tell me about a project where you designed an AI system architecture.",
        a: "Situation: The VEX AI Robotics Competition uses autonomous robots that navigate a 12×12-foot field using GPS sensors, an AI Vision System, and a Sensor Fusion Map. The Sensor Fusion Map could only see directly in front of each robot, and had no Z-axis awareness — making it impossible for robots to compare elevation heights during the scoring phase. Task: Identify the root cause of the system's decision-making failures and propose a concrete, layered architecture to address them. Action: (1) Conducted a need-finding exercise across three match scenarios (start, midmatch, end-of-match elevation phase) to map which limitations caused which failures. (2) Designed a baseline solution: SpotFi WiFi localization (decimeter-level accuracy using existing V5 Radio) + four Intel RealSense RGB-D cameras at field corners for full 3D field visibility. (3) Proposed a design refinement: P2P decentralized coordination via V5 Radio, allowing all four robots to share GPS, vision, and Sensor Fusion data in real time — distributed computing across NVIDIA Jetson Nano processors. (4) Defined quantitative evaluation metrics: match scoring trends, CPU runtime benchmarks, and 3D map rendering quality. Result: a fully designed, layered system architecture with graceful degradation fallbacks, evaluation methodology, and implementation roadmap."
      },
      {
        q: "What is sensor fusion and why is it important in autonomous systems?",
        a: "Sensor fusion is the process of combining data from multiple sensors to produce a more accurate, complete picture of the environment than any single sensor could provide alone. Each sensor type has blind spots: a GPS gives position but no visual context; a camera gives visual context but no precise depth; an accelerometer gives motion but drifts over time. Fusing them compensates for individual weaknesses. In the VEX AI system, the Sensor Fusion Map combines GPS position data with AI Vision detections to build a timestamped spatial model of the field. The limitation I identified was that fusion was only happening within a single robot's forward-facing perspective — not across the full field or in 3D. Adding RGB-D cameras and P2P data sharing extended fusion to include all four robots' observations simultaneously, creating a shared ground truth."
      },
      {
        q: "What is edge AI and what role does the NVIDIA Jetson Nano play?",
        a: "Edge AI means running AI inference directly on the device — at the 'edge' of the network — rather than sending data to a cloud server and waiting for a response. For real-time autonomous systems, latency is critical: a robot making a navigation decision can't wait 200ms for a cloud API response. The NVIDIA Jetson Nano is a compact, energy-efficient processor designed for edge AI inference. It runs neural networks and computer vision algorithms locally — fast enough for real-time robotics — without requiring a network connection or cloud compute. In the VEX AI system, the Jetson Nano processes RGB-D camera data and runs the SpotFi localization algorithm on the robot itself. In the P2P design refinement, it also handles the distributed data processing load — receiving observations from peer robots and fusing them with the robot's own sensor data, all within the match's real-time constraints."
      }
    ]
  }

  ,
  {
    id: "imdb-golden-age",
    title: "IMDb \"Golden Age\" TV Analysis",
    subtitle: "Basic Python · Data Preprocessing · Hypothesis Testing",
    institution: "TripleTen · Sprint 3 — Basic Python",
    year: "2025",
    type: "EDA Project",
    description: [
      "Tested the hypothesis that highly-rated TV shows from the 'Golden Age' of television (1999+) also receive the most IMDb votes — involving three-stage data preprocessing: column normalization, missing value handling, and implicit duplicate removal.",
      "Confirmed the hypothesis: shows with scores 7–9 had the highest average vote counts. Analysis covered ~94% of the original dataset after preprocessing."
    ],
    tags: ["Python", "Pandas", "EDA", "Hypothesis Testing", "Data Cleaning", "groupby", "Vectorized Operations"],
    qa: [
      {
        q: "Walk me through your data preprocessing approach in this project.",
        a: "The dataset had three distinct data quality issues: (1) Column name formatting — names had mixed case, leading whitespace, and digit '0' in place of letter 'o'. Fixed with a single pandas chain: df.columns = df.columns.str.lower().str.strip().str.replace('0', 'o'). (2) Missing values — 4,609 rows had no IMDb score and 4,726 had no vote count, about 6% of the data. Since both columns were essential, all rows with any NaN were dropped with df.dropna(inplace=True). (3) Duplicates — 6,994 exact duplicate rows were removed with drop_duplicates(). More subtly, the type column had 9 different strings representing 2 categories — 'SHOW', 'shows', 'tv show', 'tv shows', 'tv', 'tv series' were all treated as separate values. A replace_wrong_show() function collapsed them into a single canonical 'SHOW' value. Key lesson: a reviewer flagged that I was re-importing pandas and re-loading the CSV multiple times throughout the notebook. Real preprocessing mutates the original DataFrame in sequence — it doesn't create new DataFrames at each step."
      },
      {
        q: "Why did you use vectorized pandas methods instead of a loop for column cleaning?",
        a: "My first version used a custom Python function that looped over the column names list, applying split(), lower(), strip(), and replace() one at a time. A reviewer pointed out this was unnecessarily verbose. The pandas idiom: df.columns.str.lower().str.strip().str.replace('0', 'o') applies all four transformations in a single vectorized operation on the Index object — no loop, no intermediate list, no reassignment. This is both more readable and more efficient because pandas can optimize the operation internally. The broader principle: whenever you're iterating over rows or index values with a Python loop to apply a simple transformation, there's almost always a vectorized pandas equivalent. Learning to reach for .str accessor methods, .apply(), or .map() first — rather than 'for row in df' — is a fundamental skill difference between beginner and intermediate pandas work."
      },
      {
        q: "What are implicit duplicates and how did you handle them?",
        a: "Implicit duplicates are values that represent the same logical category but are stored as different strings — 'SHOW', 'shows', 'tv show', 'tv shows', 'tv', 'tv series' all mean the same thing but would be treated as six separate categories by any groupby or filter operation. How to find them: df['type'].sort_values().unique() — printing unique values in sorted order makes it easy to visually spot variants of the same category. How to fix them: df['type'].replace(wrong_list, correct_value) maps all variants to a single canonical string. Why they're dangerous: a filter like df[df['type'] == 'SHOW'] would silently miss all rows with 'shows', 'tv show', etc., producing an incomplete subset with no error — the bug is invisible until you check the result size."
      },
      {
        q: "What was the hypothesis and what did you find?",
        a: "Hypothesis: Highly-rated TV shows released during the 'Golden Age' of television (starting 1999 with The Sopranos) also receive the most IMDb votes — i.e., critical quality and audience engagement correlate. Method: (1) Filtered to shows released 1999 or later, excluding movies. (2) Rounded IMDb scores to integer buckets (1–10) for grouped analysis. (3) Identified outlier buckets with too few shows (scores 2, 3, and 10 excluded). (4) Computed average vote count per score bucket for the valid range (4–9). Result: the hypothesis was confirmed. Shows with scores of 7–9 had the highest average vote counts. Score 4 was a minor exception (outranking 5 and 6), but the top three score buckets clustered at the top of the vote distribution. The analysis covered approximately 94% of the original dataset after preprocessing."
      },
      {
        q: "How would you describe your pandas groupby approach for this analysis?",
        a: "The core analysis pattern: (1) Round scores: df['score_bucket'] = df['imdb_score'].round() — creates integer buckets 1–10. (2) Filter valid range: Boolean indexing to keep only scores 4–9, removes outlier buckets with too few data points. (3) Aggregate: df.groupby('score_bucket')['imdb_votes'].mean().round() — average votes per score bucket. (4) Rename and sort: .rename(columns={...}).sort_values('Average Votes', ascending=False) — present results clearly. This is a standard aggregation pipeline: filter → group → aggregate → present. The same pattern applies across most exploratory analyses — the specific columns change, the structure doesn't."
      }
    ]
  }

  ,
  {
    id: "ai-fairness-cs6603",
    title: "AI Fairness in Housing Lending",
    subtitle: "Disparate Impact · Reweighting · Fannie Mae 2008 Mortgage Data",
    institution: "Georgia Tech CS6603 — AI, Ethics, and Society",
    year: "2024",
    type: "Research Project",
    description: [
      "Applied Disparate Impact (DI) and Statistical Parity Difference (SPD) to 2.5M Fannie Mae 2008 mortgage records across Race and Gender — measuring disparity in LTV at origination and Borrower Income Ratio.",
      "Applied Reweighting pre-processing bias mitigation and measured whether it survives classifier training. Finding: it doesn't — pre-processing alone is insufficient when structural disparity is encoded in the features themselves."
    ],
    tags: ["Python", "AI Fairness", "Disparate Impact", "Statistical Parity Difference", "Reweighting", "sklearn", "Fairness Metrics", "ML Ethics"],
    qa: [
      {
        q: "Tell me about a project where you worked with AI fairness or algorithmic bias.",
        a: "Situation: For CS6603 at Georgia Tech, I analyzed the 2008 Fannie Mae Single-Family Mortgage Dataset — 2,558,959 real lending decisions made during the year the U.S. housing market collapsed. The dataset contains five variables associated with legally protected classes under the Civil Rights Act and the Equal Pay Act. Task: Measure the extent of racial and gender disparity in two loan outcome variables — LTV at origination and Borrower Income Ratio — using established fairness metric algorithms, then apply a pre-processing bias mitigation technique and determine whether the improvement survives a full classifier training pipeline. Action: (1) Selected Race (Asian as privileged, Black or African American as unprivileged) and Gender (Male as privileged, Female as unprivileged). (2) Computed Disparate Impact (DI) and Statistical Parity Difference (SPD) for all four combinations. (3) Applied Reweighting — a pre-processing bias mitigation algorithm that rebalances sample weights across groups without modifying feature values. (4) Ran both the original and reweighted datasets through a full train/test classifier pipeline and re-measured fairness metrics. Result: Reweighting brought all four DI values into or near the 0.8–1.25 acceptable range and collapsed SPD values to near zero. But after classifier training, fairness metrics reverted to near-original values — demonstrating that pre-processing alone is insufficient when structural disparity is encoded in the features."
      },
      {
        q: "What is Disparate Impact and how is it measured?",
        a: "Disparate Impact (DI) measures the ratio of the favorable outcome rate for the unprivileged group to the rate for the privileged group: DI = (Unprivileged Group Favorable Rate) / (Privileged Group Favorable Rate). The ideal value is 1.0 — both groups achieve favorable outcomes at the same rate. The legally accepted range in lending and hiring contexts is 0.8–1.25. A DI below 0.8 indicates the unprivileged group achieves favorable outcomes at less than 80% the rate of the privileged group — the 'four-fifths rule' from U.S. employment law. In this project, Race & LTV had DI = 0.7576: Black or African American borrowers achieved favorable LTV outcomes at only 75.76% the rate of Asian borrowers — a 24.24% shortfall below the threshold. Statistical Parity Difference (SPD) is the complement: SPD = Unprivileged Rate − Privileged Rate. Ideal value = 0.0. Race & LTV had SPD = −0.2031: a 20.3 percentage-point gap."
      },
      {
        q: "Why didn't Reweighting fix the bias after classifier training?",
        a: "Reweighting corrects the distributional imbalance in the dataset by assigning higher weights to underrepresented group-outcome combinations. This succeeds at the dataset level — the reweighted distributions look balanced. But a classifier trained on that data still learns from the feature values themselves. In the Fannie Mae 2008 data, the income and LTV disparities between racial and gender groups are structural: Black borrowers genuinely had lower income ratios and higher LTV at origination in 2008 — not because of random noise, but because of decades of redlining, discriminatory access to credit, and unequal wealth accumulation. Those patterns are baked into the features. A classifier minimizing prediction error on those features will learn to use income and LTV as proxies for race — even without ever seeing the race variable directly. Reweighting adjusts how much each sample contributes to the loss function, but it cannot change what the feature values are. This is why fairness-aware ML requires in-processing techniques (adversarial debiasing, fairness constraints in the objective function) or post-processing adjustments (calibrated equalized odds) — not just data-level fixes."
      },
      {
        q: "What are the regulatory and legal implications of ML bias in lending?",
        a: "Housing and lending in the U.S. are regulated by several laws: (1) Equal Credit Opportunity Act (ECOA) — prohibits lenders from discriminating based on race, color, religion, national origin, sex, familial status, or handicap. This covers algorithmic lending decisions. (2) Fair Housing Act — prohibits discriminatory housing practices including mortgage lending on the same protected-class basis. (3) Civil Rights Act of 1964 — the legal foundation for protected-class designations. The critical compliance challenge: ECOA prohibits explicit use of protected-class variables, but it cannot prevent a model from learning proxies. A model that never sees 'race' as a feature can still learn that zip code, income ratio, and LTV — all correlated with race due to historical inequity — predict outcomes in ways that produce disparate impact. This is why regulators are increasingly requiring disparate impact testing of ML models. From a practitioner standpoint: if you build a lending model, the model card should include DI and SPD for all relevant protected classes, measured on test data, with a documented mitigation strategy if any metric falls outside the 0.8–1.25 range."
      }
    ]
  }

  ,
  {
    id: "megaline-sda",
    title: "Megaline Prepaid Plan SDA",
    subtitle: "Statistical Data Analysis · Two-Sample T-Test · Revenue Analysis",
    institution: "TripleTen Sprint 3 — Statistical Data Analysis",
    year: "2025",
    type: "EDA Project",
    description: [
      "Compared Megaline's Surf and Ultimate prepaid plans across 500 clients using SDA tools — barplots, histograms, boxplots — and two-sample t-tests to determine which plan is more profitable and whether NY-NJ users differ from the rest of the country.",
      "Result: T=−8.23, p≈0 — Surf generates significantly more average revenue ($50.33 vs $47.31) despite costing 3.5× less, due to high overage rates. No significant regional difference found."
    ],
    tags: ["Python", "Pandas", "NumPy", "scipy.stats", "Matplotlib", "Statistical Hypothesis Testing", "SDA", "EDA"],
    qa: [
      {
        q: "Walk me through a project where you used statistical analysis to drive a business decision.",
        a: "Situation: Megaline, a telecom operator, offers two prepaid plans — Surf ($20/mo, 500 min, 50 messages, 15 GB) and Ultimate ($70/mo, 3000 min, 1000 messages, 30 GB). Their commercial team needed to know which plan generates more actual revenue to allocate advertising budget. Task: Using behavioral data for 500 clients across 2018, compute per-user monthly revenue, analyze usage patterns, and formally test whether mean revenues differ significantly. Action: (1) Merged 5 CSV tables and computed per-user monthly aggregates using .dt.to_period('M') and groupby. (2) Built a calculate_revenue() function applying plan-specific overage rates. (3) Applied np.ceil() rounding per call for minutes and aggregate for internet GB — matching real telecom billing rules. (4) Visualized behavior distributions using barplots, histograms, and boxplots. (5) Ran a two-sample t-test: Surf (n=1573 user-months, mean=$50.33, std=$55.26) vs. Ultimate (n=720, mean=$47.31, std=$11.40). Result: T=−8.23, p≈0 — rejected H0. Surf generates significantly more revenue. A second t-test on NY-NJ vs. the rest returned T=0.89, p=0.38 — no regional difference. Recommendation: prioritize Surf plan advertising."
      },
      {
        q: "How did you compute monthly revenue per user, and what were the key engineering decisions?",
        a: "Key decisions: (1) Rounding rules — minutes are rounded up per call using np.ceil() before aggregation: a 1.3-minute call bills as 2 minutes. Internet GB are rounded up at the aggregate monthly level — not per session. This matches real telecom billing and materially affects revenue calculations. (2) Overage calculation — each plan includes a monthly allotment. Users only pay for what exceeds the plan limit: overage = max(0, actual_usage - plan_limit). Surf overages: $0.03/min, $0.03/message, $10/GB. Ultimate overages: $0.01/min, $0.01/message, $7/GB. Base monthly fee is always charged regardless of usage. (3) Monthly aggregation — used .dt.to_period('M') to convert timestamps to year-month periods, then groupby(['user_id', 'year_month']) to aggregate usage. (4) Missing months — users who made no calls in a given month still owe their base plan fee. Used fillna(0) after merges to ensure missing activity rows are treated as zero usage, not excluded from revenue."
      },
      {
        q: "Explain the two-sample t-test you ran. What assumptions does it make and were they met?",
        a: "A two-sample independent t-test tests whether the means of two independent groups differ significantly. H0: population means are equal. H1: they differ. Assumptions: (1) Independence — the two samples (Surf vs. Ultimate users) are independent by design, since a user is on one plan. (2) Normality — with n=1573 and n=720, the Central Limit Theorem guarantees the sampling distribution of the mean is approximately normal regardless of the underlying distribution shape. (3) Homogeneity of variance — Surf std ($55.26) vs. Ultimate ($11.40) differ substantially. Used equal_var=False (Welch's t-test) in scipy.stats.ttest_ind. Results: H1 (Surf vs. Ultimate): T=−8.23, p≈0 → reject H0. H2 (NY-NJ vs. others): T=0.89, p=0.38 → fail to reject H0. The negative T-statistic reflects that Surf was computed as Group 1 — the sign just indicates direction. What matters is the magnitude (8.23) and p-value (essentially 0)."
      },
      {
        q: "The Surf plan is cheaper ($20 vs $70) but generates more revenue. How is that possible?",
        a: "Surf generates more revenue because its users exceed the plan limits frequently, and the overage rates add up. Surf's monthly allotments are deliberately modest: 500 minutes, 50 messages, 15 GB. Many users regularly exceed these — particularly on internet usage, where the $10/GB overage rate is significant. A user who uses 20 GB in a month pays $20 (base) + $50 (5 GB overage × $10) = $70 — the same as the Ultimate base fee — without even being on Ultimate. The standard deviation tells the story: Surf std=$55.26 vs. Ultimate std=$11.40. Ultimate users are predictable — they pay $70/month with minimal overages. Surf users are variable — some pay close to $20, others pay $80–100+ in heavy months. The t-test showed Surf's mean is significantly higher even accounting for that variance."
      },
      {
        q: "What did the barplots, histograms, and boxplots tell you that the t-test didn't?",
        a: "The t-test answers one question: do means differ significantly? The visualizations answered different questions about shape, spread, and patterns. Barplots (mean usage by month): showed that usage grows across 2018 — call minutes, messages, and internet all trend upward. This temporal growth pattern is invisible in an aggregate t-test and matters for forecasting and capacity planning. Histograms (distribution shape): revealed that call minute distributions are right-skewed — most users cluster near the plan limits, with a long tail of heavy users. Internet usage histograms showed a bimodal shape for Surf users, suggesting two clusters: light users who stay within limits and heavy users who consistently overage. Boxplots (spread and outliers): made the variance difference between plans immediately visible. Ultimate boxplots are compact; Surf boxplots have long upper whiskers and numerous high outliers. The visualizations also validated data cleaning decisions before running any statistical tests — this is why SDA always precedes hypothesis testing."
      }
    ]
  }
];
