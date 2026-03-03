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

  // ── Future projects will be added here ──────────────────────
];
