import { libraryTextGuides } from "./library-guides";
import { addedGuides } from "./added-guides";
export type LearningGuide = {
  title: string;
  source: string;
  project: string;
  sections: [string, string, string, string, string];
  foundations: string[];
  terms: [string, string][];
  problem: string[];
  steps: [string, string][];
  training: string[];
  example: string[];
  evidence: string[];
  interpretation: string[];
  limitations: string[];
  takeaway: string;
  question: string;
  answer: string;
};

// Paper-specific summaries are paired with original teaching examples.
// Examples and diagrams are explanatory constructions, not reported experiments.
export const learningGuides: Record<string, LearningGuide> = {
  ...libraryTextGuides,
  ...addedGuides,
  "pi-zero-vision-language-action-flow-model": {
    title: "From understanding an instruction to controlling a robot",
    source: "https://arxiv.org/html/2410.24164v1",
    project: "https://www.pi.website/blog/pi0",
    sections: ["Introduction", "The π₀ Model", "Data Collection and Training Recipe", "Experimental Evaluation", "Discussion, Limitations, and Future Work"],
    foundations: [
      "VLA stands for vision-language-action. Vision supplies images of the scene; language specifies what the person wants; action is a numerical command the robot can execute. A VLA connects these in a learned model. For example, ‘put the cup in the sink’ must eventually become changes to arm position and gripper state. Producing a convincing sentence about the cup is only part of that problem.",
      "A robot policy is the rule that chooses actions from observations. An observation can include camera images and measurements of the robot’s own joints. The robot repeats this process as the scene changes. π₀ studies how to combine a model’s existing image-and-language knowledge with the continuous, coordinated movement needed for manipulation."
    ],
    terms: [
      ["VLM · vision-language model", "A model that processes images and language. Its learned representations can help connect an object’s appearance with its name or use."],
      ["Proprioception", "Measurements of the robot’s own configuration, such as joint angles. A camera sees the room; joint sensors tell the robot how its arm is currently bent."],
      ["Action chunk", "Several consecutive actions predicted together. A chunk describes a short movement, rather than a whole household task."],
      ["Flow matching", "Learning a transformation from random samples to samples resembling training data. Here the samples are numerical action sequences, not pictures."]
    ],
    problem: [
      "The paper adds a continuous action expert to a pretrained vision-language model. It combines this architecture with diverse robot training and task-specific post-training. These are separate ingredients: an output format suitable for motion does not supply experience, and a large dataset does not by itself guarantee precise control.",
      "Consider grasping a folded towel. Recognizing ‘towel’ identifies the object, but the robot must also choose an approach, coordinate its joints, and close its gripper at the right time. The policy must turn semantic information into a feasible sequence of physical commands."
    ],
    steps: [
      ["Encode the situation", "Camera images, an instruction, and joint state provide the context. The vision-language backbone supplies representations that the action expert can use."],
      ["Refine an action chunk", "The action expert starts from noise and repeatedly updates a continuous action sequence using a learned flow. These refinement steps occur inside the model; the robot is not executing random movements."],
      ["Execute with feedback", "The generated actions drive the robot. New observations allow subsequent predictions to respond to the changed scene. Planning actions and physically executing them are distinct processes."]
    ],
    training: [
      "The authors separate broad pretraining from narrower post-training. Their own data spans seven robot configurations and 68 task categories, alongside public robot data. More specialized demonstrations then improve performance on demanding tasks.",
      "Why separate the stages? A broad dataset can contain varied starting situations and recoveries. A carefully selected dataset can emphasize efficient execution. As a general learning principle, training only on perfect approaches can leave a policy poorly prepared for the situations its own errors create."
    ],
    example: [
      "Teaching example: imagine an instruction to place a towel in a basket. The camera locates the towel and basket; joint state describes the arm’s starting position. An action chunk might approach, lower, and begin closing the gripper. It is a set of numbers over time, not the words ‘pick up towel.’",
      "If the towel shifts after contact, the next observation differs from the original one. Replanning can adjust the approach. It cannot guarantee recovery: the model still needs relevant experience, useful observations, and a robot capable of the required movement."
    ],
    evidence: [
      "The paper evaluates base-model control, instruction following, adaptation to dexterous tasks, and more complex multistage activities. Examples include laundry folding and box assembly. Some settings use a separate high-level model to provide intermediate instructions.",
      "Read these as different experimental questions. Base-model performance asks what broad training already provides. Post-training asks what the model can learn from additional target-task data. A system using an extra planner also tests that combined system."
    ],
    interpretation: [
      "Ablation means changing or removing an ingredient to investigate its effect. To assess the role of the pretrained backbone, look at the paper’s comparison with the model trained without that initialization. To assess adaptation, compare settings with equivalent target-task data.",
      "Reader’s interpretation: the central argument concerns the combination of semantic pretraining, continuous action generation, and a training recipe. A successful laundry demonstration alone cannot tell us which ingredient was responsible or how often the system would succeed in a different home."
    ],
    limitations: [
      "The paper presents a prototype with remaining generalization and robustness problems. Its results do not establish reliable operation across arbitrary tasks and environments.",
      "For deployment, specify the missing test: a different camera position, an unfamiliar fabric, a cluttered basket, or recovery after a failed grasp. These changes challenge different parts of the system. ‘General-purpose’ is a research aim; it is not a measured success rate for every situation."
    ],
    takeaway: "π₀ connects image-and-language representations to continuous action sequences. Understanding its contribution requires following both the action generator and the data recipe.",
    question: "If the model understands ‘towel,’ why might it still fail to fold one?",
    answer: "Object recognition does not specify contact, force, timing, or how the fabric will move. Those require physical experience and feedback. Language knowledge can help choose the task while the learned motor behavior still fails."
  },
  "openvla-open-source-vision-language-action-model": {
    title: "How a language-model interface becomes a robot controller",
    source: "https://arxiv.org/html/2406.09246v1",
    project: "https://openvla.github.io/",
    sections: ["Introduction", "The OpenVLA Model", "Training and Fine-Tuning", "Experimental Evaluation", "Limitations"],
    foundations: [
      "A vision-language-action model, or VLA, receives an image and an instruction and predicts robot actions. An action is a numerical control signal: for example, a change in the gripper’s position, its orientation, and whether it should open. The word ‘action’ does not mean a written plan that another system automatically understands.",
      "OpenVLA starts with a pretrained vision-language model and adapts it to this output. Pretraining means learning useful patterns before the target robotics task. The practical question is whether researchers can reuse and adapt those patterns instead of collecting enough data to train every new robot from scratch."
    ],
    terms: [
      ["Token", "One item in a model’s input or output sequence. Tokens can represent text fragments, image information, or encoded action values."],
      ["Discretization", "Replacing a continuous range with a finite set of intervals. A predicted interval is decoded back into a numerical action."],
      ["Fine-tuning", "Continuing training on a target dataset so a pretrained model adapts to a particular robot or task."],
      ["LoRA", "Low-rank adaptation: learning a relatively small set of added parameters instead of updating every weight in the base model."]
    ],
    problem: [
      "OpenVLA combines visual features from DINOv2 and SigLIP with a Llama 2 backbone, then trains the model to produce action tokens. Its contribution includes an open model and an investigation of efficient adaptation, rather than only a demonstration on one fixed robot.",
      "The representation choice matters. A language model already predicts sequences of discrete tokens. Encoding actions in that format makes its existing machinery usable for control, but someone must define how each predicted token translates into a physical quantity."
    ],
    steps: [
      ["Image + instruction", "Visual encoders turn the camera image into features. The instruction supplies the intended task. Both inform the model’s action prediction."],
      ["Predict action tokens", "The model produces discretized action values as a sequence. The output is trained against actions recorded in robot demonstrations."],
      ["Decode into control", "The action tokens are converted into numerical commands in the robot’s expected scale and representation. A new camera observation supports the next prediction."]
    ],
    training: [
      "The reported model has seven billion parameters and uses 970,000 robot demonstrations. The authors also investigate adaptation with LoRA and reduced-precision inference.",
      "A demonstration supplies more than a video: it pairs what the robot observed with what action followed. During training, prediction errors change the model’s parameters. During deployment, parameters are normally fixed; the model computes new outputs from new observations. Those are different uses of computation."
    ],
    example: [
      "Teaching example: suppose a single control dimension covers −1 to +1 and we divide it into eight equal intervals. A requested value of 0.30 belongs to the interval from 0.25 to 0.50; decoding its center gives 0.375. This deliberately small example makes quantization error visible. It is not OpenVLA’s actual bin count.",
      "A full action has several dimensions, each requiring the correct units and scaling. A model can predict a plausible token sequence and still produce the wrong movement if the deployment code uses the wrong normalization. The token-to-controller interface is part of the system."
    ],
    evidence: [
      "The authors report a 16.5-percentage-point advantage over RT-2-X across 29 tasks on two robot embodiments. They also evaluate fine-tuning separately. This is a comparison within the reported evaluation, not a universal ranking of robot controllers.",
      "The project highlights stronger language grounding in settings with multiple tasks and objects. Read the task descriptions to determine whether a result tests choosing the intended object, executing a difficult movement, or both."
    ],
    interpretation: [
      "Percentage points and relative improvement are different. If a hypothetical baseline succeeds 40% of the time and a new model succeeds 56.5%, the gain is 16.5 percentage points, or 41.25% relative to the baseline. These numbers illustrate the arithmetic; they are not the paper’s aggregate success rates.",
      "Reader’s interpretation: compare data, task selection, and adaptation budget alongside model size. A smaller model beating a larger one does not isolate parameter count as the cause. Several ingredients changed, so the result supports the tested system as a whole."
    ],
    limitations: [
      "The paper notes limitations for high-frequency and dexterous control. Its original action representation and inference setup should not be confused with later action-chunking extensions.",
      "Availability also has layers: released robot-model weights allow inspection and adaptation, but do not imply that every upstream model’s pretraining dataset is reproducible. When assessing openness, distinguish the checkpoint, training code, robot dataset, and upstream components."
    ],
    takeaway: "OpenVLA makes a pretrained image-and-language model predict robot-control tokens and examines how to adapt that model in practice. The numerical decoding step is essential to understanding what a VLA actually does.",
    question: "Does fine-tuning mean the robot learns automatically whenever someone gives it a new instruction?",
    answer: "No. An instruction changes the input at inference time. Fine-tuning is a separate training process that updates parameters using examples. The robot can follow a new instruction without its weights changing."
  },
  "diffusion-policy-visuomotor-policy-learning": {
    title: "Why generating a movement can work better than averaging one",
    source: "https://arxiv.org/html/2303.04137v5",
    project: "https://diffusion-policy.cs.columbia.edu/",
    sections: ["Introduction", "Diffusion Policy", "Training and Inference", "Evaluation; Appendix B.2", "Discussion"],
    foundations: [
      "A visuomotor policy connects visual observations to motor commands. Imitation learning trains that policy from demonstrations: examples of what a person or another controller did in particular situations. It is different from learning entirely by trial and error with a reward.",
      "The difficulty is that one situation can have several good responses. A gripper might approach an object from either side. A predictor trained to minimize squared error can average these alternatives and choose a movement nobody demonstrated. Diffusion Policy learns a distribution of possible action sequences instead."
    ],
    terms: [
      ["Distribution", "A description of which outputs are plausible and how likely they are. It can assign probability to several different successful movements."],
      ["Multimodal", "Having several distinct groups of likely outputs. Here it means different valid movements, not different input types such as images and text."],
      ["Denoising", "Learning to remove deliberately added random corruption from training samples. At inference, repeated refinement turns noise into a plausible sample."],
      ["Receding horizon", "Predict several future actions, execute only an initial portion, then predict again using fresh observations."]
    ],
    problem: [
      "Diffusion Policy generates action sequences using conditional denoising, with observations guiding the prediction. It combines this with receding-horizon execution. The generated object is a sequence of control values, rather than a future video or a written task plan.",
      "Imagine two demonstrations that go around an obstacle on opposite sides. Their pointwise average may go through the obstacle. This teaching example explains the motivation for a distribution with separate alternatives. It does not mean every conventional policy always averages or every diffusion sample is safe."
    ],
    steps: [
      ["Observe the current scene", "Images and available robot-state measurements condition the generator. ‘Conditional’ means the action distribution depends on this observation."],
      ["Denoise a sequence", "Start with random numerical values for a future action sequence. Repeated learned updates turn them into a candidate movement consistent with the observation and training data."],
      ["Act, then reobserve", "Execute the beginning of the sequence and use new observations to predict again. This balances coordinated movement with an opportunity to correct after the world changes."]
    ],
    training: [
      "During training, noise is added to demonstration actions and the network learns to predict that noise. During inference, it starts from noise and iteratively constructs actions. The paper studies convolutional and transformer implementations.",
      "Keep two timelines separate. Denoising iterations refine a proposed sequence inside the computer. Robot timesteps are moments when the physical controller executes actions. Increasing the number of internal refinement steps costs computation; it does not give the robot additional observations automatically."
    ],
    example: [
      "Teaching example: the left route passes through horizontal position −1 and the right route through +1. Both avoid an obstacle at 0. Their equally weighted mean is 0, precisely where movement is undesirable. A sampled policy can represent alternatives rather than collapsing them into that mean.",
      "Suppose a policy predicts 16 timesteps but executes the first four before observing again. The unexecuted predictions help represent a coordinated sequence, yet they are not an irrevocable commitment. These horizon lengths are illustrative; they are not a universal configuration prescribed by the paper."
    ],
    evidence: [
      "The linked journal version evaluates 15 tasks across four benchmarks. Its reported 46.9% improvement averages task-wise relative gains over the best compared baseline; Appendix B.2 explains the calculation. It is not a 46.9-percentage-point gain on every task.",
      "The authors’ project includes real manipulation demonstrations and a visualization of alternative action modes. Compare these with the quantitative tables: a video makes a behavior visible, while repeated trials estimate how consistently it occurs."
    ],
    interpretation: [
      "For illustration, improving from 50% to 75% success is a 25-percentage-point gain and a 50% relative gain. Averaging relative improvements weights the ratios for each task, not the total number of successful trials across the whole suite.",
      "Reader’s interpretation: inspect observation type, action representation, and checkpoint selection before comparing a score. A state-based policy can receive object coordinates that an image-based policy must infer. Those settings answer different questions, even when the task name is identical."
    ],
    limitations: [
      "Iterative sampling introduces a computation-versus-latency tradeoff. The project also frames the method as learning from demonstrations, so its behavior depends on the coverage of those examples.",
      "A flexible distribution is not a collision checker or a guarantee of successful recovery. If the camera misses an obstacle, or demonstrations do not cover a failed grasp, generating a plausible-looking sequence may still produce failure. A short action horizon also does not supply an explicit plan for a long task."
    ],
    takeaway: "The key change is to model several plausible action sequences and repeatedly revise execution using feedback. Understand the distribution, the internal denoising loop, and the physical control loop separately.",
    question: "Does the robot try random movements while the sequence is being denoised?",
    answer: "No. The noisy sequence is an internal numerical candidate. Refinement occurs before those selected actions are sent to the physical controller. Noise in the generator is not an instruction to move the robot randomly."
  },
  "rt-2-vision-language-action-models": {
    title: "What web knowledge can—and cannot—teach a robot",
    source: "https://arxiv.org/html/2307.15818v1",
    project: "https://robotics-transformer2.github.io/",
    sections: ["Introduction", "Method", "Method", "Experiments", "Limitations"],
    foundations: [
      "VLA means vision-language-action: a model uses camera observations and an instruction to predict commands a robot can execute. A vision-language model, or VLM, already connects images and words. RT-2 asks whether that existing knowledge can help determine physical actions.",
      "There are two distinct problems in ‘pick up something to drink.’ The system must identify a suitable object and it must execute a grasp. Knowledge about an object’s use may help with selection, while the physical movement still depends on robot experience. Keep this distinction in mind throughout the paper."
    ],
    terms: [["Semantic knowledge", "Knowledge about meaning: for example, which object could satisfy an instruction."],["Action tokens", "Discrete output symbols that are decoded into numerical robot commands."],["Co-fine-tuning", "Continuing training on a mixture of robot examples and image-language tasks."],["Generalization", "Successful behavior on a specified change from training: new objects, scenes, instructions, or skills. These changes are not interchangeable."]],
    problem: ["RT-2 adapts pretrained vision-language models to predict actions encoded as tokens. Training mixes robot trajectories with vision-language examples. The goal is to use knowledge from broad data in a physical control setting.","Encoding is a bridge, not a source of motor skill. Writing a displacement as a token makes it compatible with sequence prediction; demonstrations still have to teach when that displacement is appropriate."],
    steps: [["Read the scene and request", "Image and text provide the current context, including which object or relationship matters."],["Generate action symbols", "The adapted model predicts tokens representing a control action, using the same broad sequence-prediction framework as language output."],["Decode and repeat", "A controller interprets the numerical action. Later observations support subsequent predictions rather than blindly replaying a fixed recording."]],
    training: ["The paper presents variants based on PaLI-X and PaLM-E. It retains vision-language training while adding robot data, rather than training a motor policy exclusively from web text.","A mixed training objective gives the model different kinds of examples. Robot trajectories connect observations to physical commands. Image-language examples can preserve broader associations. The relevant experimental question is whether the combination changes robot behavior on specified tests."],
    example: ["Teaching example: a table holds a sponge and a sealed drink. The instruction is ‘bring me something to drink.’ Semantic knowledge can make the drink the preferred target even if that wording was uncommon in the robot demonstrations.","That does not establish that the robot can open the bottle, pour without spilling, or manipulate a novel cap. Selecting a familiar grasp for a new semantic reason is different from acquiring a new physical skill."],
    evidence: ["The project reports evaluation over more than 6,000 robot trials, including tests of unfamiliar objects and semantic reasoning. These experiments investigate whether broad pretraining influences control behavior.","Separate a demonstrated task from the category it is intended to test. An unfamiliar-object trial concerns a particular object and setting; the name of the category does not establish success for all unfamiliar objects."],
    interpretation: ["Reader’s interpretation: semantic transfer is valuable even when the motor repertoire stays similar. It broadens when a learned skill can be selected. It should not be presented as evidence that reading about a movement teaches the robot to execute it.","To isolate that distinction, imagine holding the grasp motion fixed while changing the instruction. Then imagine keeping the instruction fixed while requiring an entirely new manipulation. These are different tests of the system."],
    limitations: ["The authors explicitly say web pretraining does not add new physical motions; skills remain limited by robot training data. They also identify high inference cost as a constraint.","A deployment question therefore needs both a meaning test and a control test: did the model choose the intended object, and did it manipulate that object successfully? One can improve while the other remains unreliable."],
    takeaway: "RT-2 connects broad visual-semantic knowledge to robot action selection. Its strongest conceptual lesson is the distinction between using known skills in new ways and learning new physical skills.",
    question: "If RT-2 selects a novel object correctly, has it learned a novel manipulation skill?",
    answer: "Not necessarily. It may be using an existing grasp on a new target. Demonstrating a new motor skill requires testing a new kind of movement or interaction, not only a new object label."
  },
  "open-x-embodiment-robotic-learning-datasets": {
    title: "When experience from one robot helps another",
    source: "https://arxiv.org/html/2310.08864v5",
    project: "https://robotics-transformer-x.github.io/",
    sections: ["Introduction", "RT-X Design", "The Open X-Embodiment Repository", "Experimental Results", "Discussion, Future Work, and Open Problems"],
    foundations: ["An embodiment is a robot’s physical form and control interface: its joints, grippers, cameras, and available actions. Two robot arms may both pick up a cup, yet their joint angles and camera views can be very different.","Cross-embodiment learning asks whether training with several robots can help a policy for a particular robot. The important question is positive transfer: does adding the other robots’ experience improve that target robot compared with an appropriate single-robot baseline?"],
    terms: [["Trajectory", "A recorded sequence of observations and actions through one episode."],["Action space", "The quantities a controller can command, such as gripper displacement, orientation, and opening."],["Normalization", "Transforming values into a consistent scale. This does not automatically reconcile different physical meanings."],["Positive transfer", "An improvement on a target task attributable to useful experience from another setting."]],
    problem: ["Open X-Embodiment provides standardized robot datasets and evaluates models called RT-X. The paper’s collection spans 22 embodiments; its experiments ask whether pooled experience benefits control.","Simply concatenating files would be insufficient. A value of 1 could mean a joint angle in one dataset and an endpoint displacement in another. File compatibility, numerical scale, and physical action meaning are separate issues."],
    steps: [["Align the records", "Put observations and actions into a common dataset structure so the training pipeline can consume them."],["Consolidate control representations", "The reported RT-X setup represents actions using gripper translation, orientation, and opening. Dataset-specific handling remains necessary."],["Train and compare", "Train on the mixture, then compare target-robot performance against models trained on individual datasets."]],
    training: ["The project describes over a million trajectories and both RT-1-X and RT-2-X models. These names refer to model families trained with the cross-robot mixture, rather than a single universal hardware controller.","Dataset size and training-mixture weight are different. A large source can dominate sampling unless the mixture is deliberately balanced. Ask which robots and behaviors occur in training, not merely how many files the repository contains."],
    example: ["Teaching example: robot A records motion in centimeters and robot B in meters. Converting both to meters fixes the unit mismatch. If A commands joint angles while B commands gripper movement, a unit conversion alone cannot fix the representation mismatch.","Even after harmonization, A’s gripper may fit between two objects while B’s does not. Shared data can teach visual or manipulation patterns without making the physical capabilities identical."],
    evidence: ["The project reports that RT-1-X improves on individual-dataset comparisons in small-data settings. RT-2-X is also tested on emergent skills and spatial relationships.","That evidence supports transfer in the evaluated settings. It does not mean the entire pooled dataset was evaluated on every robot, or that a new robot can be controlled without integration work."],
    interpretation: ["Reader’s interpretation: the strongest comparison holds the target evaluation fixed and changes which experience is available for training. A changed model size or architecture can also affect the result, so read each comparison’s setup.","A dataset contribution and a model contribution should be assessed separately. A useful common data format can enable later experiments even where a particular baseline model shows limited gains."],
    limitations: ["The paper discusses open problems in heterogeneous data and generalization. Pooling demonstrations does not remove differences in sensors, controllers, or collection practices.","Consider a rare task that is overwhelmed by common pick-and-place examples. More total data can coexist with very little relevant data. Coverage of the task you care about is more informative than a headline trajectory count."],
    takeaway: "The central idea is sharing useful experience across different bodies while preserving meaningful observation and action interfaces. Common storage is the start of that problem, not its completion.",
    question: "If two datasets use the same column names, are their actions interchangeable?",
    answer: "No. Units, coordinate frames, control frequency, and action semantics can differ. Those must be checked before common columns become meaningful common training examples."
  },
  "octo-generalist-robot-policy": {
    title: "A pretrained policy that can adapt to a different robot",
    source: "https://arxiv.org/html/2405.12213v2",
    project: "https://octo-models.github.io/",
    sections: ["Introduction", "The Octo Model", "Pretraining and Finetuning", "Experiments", "Discussion"],
    foundations: ["A generalist robot policy is trained across multiple tasks or settings. It can serve as an initialization: a useful set of learned parameters from which to adapt a model, rather than a promise that every new robot will work immediately.","Octo focuses on practical adaptation when inputs or outputs change. A laboratory might add a wrist camera or use a gripper controlled differently from those in the training set. Reusing experience requires an architecture that can accommodate those interfaces."],
    terms: [["Transformer", "A neural network that lets representations exchange information through attention. In a policy, that information can describe observations and a goal."],["Tokenizer", "An input-specific encoder that converts data into a sequence the shared network can process."],["Action head", "The output component that converts internal representations into predicted actions."],["Goal image", "A picture specifying a desired outcome, used as an alternative to a written task instruction."]],
    problem: ["Octo combines modular inputs, a shared transformer, and a diffusion action head. Its design allows changes to observation and action interfaces during fine-tuning.","This separates reusable processing from interface-specific components. A new sensor still needs an appropriate encoder; a new control format still needs a suitable output head. Flexibility means those changes can be made without throwing away all pretrained parameters."],
    steps: [["Encode available inputs", "Task instructions or goal images and sensor observations are converted to tokens. Missing observations are masked rather than treated as valid data."],["Share information", "The transformer processes the task and observation representations. Readout representations collect information for action prediction."],["Generate an action chunk", "A diffusion head predicts consecutive actions. When adapting to a new action space, the relevant output component can change."]],
    training: ["The model is pretrained on 800,000 Open X-Embodiment trajectories. The project releases 27-million- and 93-million-parameter versions, and the paper evaluates adaptation across nine robot platforms.","Fine-tuning updates a pretrained model using target examples. The practical advantage depends on how much data and computation that adaptation needs. Compare it with training from scratch under the same target-data budget."],
    example: ["Teaching example: a pretrained policy uses one external camera, but your robot adds a wrist camera. An additional encoder can make that image available to the shared model. The model must then learn how this view relates to useful actions.","Adding an input port is not enough. A camera looking at the ceiling supplies little grasp information. Fine-tuning must connect the new measurement to the task, and evaluation must test whether that information actually improves performance."],
    evidence: ["The paper evaluates fine-tuning to new sensors and action spaces. Its ablations examine architectural and training-data choices. This supports its intended use as an adaptable policy initialization.","Treat a post-adaptation result as a result of pretraining plus adaptation. It is not a zero-shot result merely because the starting checkpoint came from a generalist model."],
    interpretation: ["Reader’s interpretation: parameter count alone does not describe adaptation cost. New encoders, output dimensions, dataset preparation, and training time all affect the workflow.","A useful comparison asks how performance changes as target demonstrations increase. If two methods see different amounts of target data, their final success rates alone cannot establish which starting representation transfers better."],
    limitations: ["The paper presents a step toward broadly applicable policies, not a finished universal controller. Target hardware and tasks still require appropriate interfaces and evaluation.","A modular network cannot recover information a sensor never observes. It also cannot make a mechanically unsuitable robot perform an action simply because another embodiment demonstrated it."],
    takeaway: "Octo treats adaptation as a central design requirement. Its shared model can retain learned structure while the sensor and action interfaces change.",
    question: "Why can a flexible input architecture still require target-robot demonstrations?",
    answer: "The architecture makes the new input representable. Demonstrations teach how that input relates to successful behavior in the new setup. Representing information and knowing how to use it are separate problems."
  },
  "mobile-aloha-bimanual-mobile-manipulation": {
    title: "Learning the coordination between arms and a moving base",
    source: "https://arxiv.org/html/2401.02117v1",
    project: "https://mobile-aloha.github.io/",
    sections: ["Introduction", "Mobile ALOHA Hardware", "Co-training with Static ALOHA Data", "Experiments", "Conclusion, Limitations and Future Directions"],
    foundations: ["Bimanual manipulation means using two arms. Mobile manipulation adds a moving base. Opening a large cabinet can require both: the hands pull while the base moves back to maintain reach and clearance.","Teleoperation lets a person control the robot while observations and actions are recorded. Imitation learning then trains a policy on those recordings. Human-controlled data collection and autonomous policy evaluation are separate stages, even if their videos look similar."],
    terms: [["Whole-body control", "Coordinating multiple controllable parts of the robot, here including arms and mobile base."],["Behavior cloning", "Supervised learning that predicts demonstrated actions from observations."],["ACT", "Action Chunking with Transformers: an imitation-learning method that predicts a sequence of actions together."],["Co-training", "Training with both mobile-task demonstrations and existing stationary-robot demonstrations."]],
    problem: ["Mobile ALOHA combines a mobile dual-arm platform with a whole-body teleoperation interface. The paper also studies whether stationary ALOHA demonstrations improve learning mobile tasks.","The data interface matters because coordinated actions are difficult to demonstrate with separate controls. If collecting examples forces a person to move the base and arms in an unnatural sequence, the learned policy may inherit that restriction."],
    steps: [["Record coordinated demonstrations", "The operator controls both arms and the base. Camera observations and control signals provide paired training examples."],["Learn from mixed experience", "Mobile-task data is combined with stationary ALOHA data. The paper evaluates several imitation-learning approaches, including ACT."],["Run the learned policy", "At evaluation time the policy predicts actions from observations. Coordinated base and arm control replaces the operator’s commands."]],
    training: ["The paper uses 50 mobile demonstrations per task and reports benefits from co-training with static data. These demonstrations are task-specific; they are not the only experience available in the co-training condition.","When reading a small-data claim, count all sources of experience. ‘50 demonstrations’ and ‘trained only on 50 demonstrations’ are different statements. A useful comparison keeps the mobile-task data fixed while changing access to the auxiliary static data."],
    example: ["Teaching example: while opening a cabinet, a fixed base can leave the arms crowded against the doors. Moving backward changes the reachable workspace and leaves room for the doors to swing. The relevant output is coordinated movement, not a separate decision to ‘navigate’ followed by one to ‘grasp.’",
      "If the handle starts a few centimeters away from its demonstrated position, replaying identical commands may miss it. A learned feedback policy can respond to the new observation, provided the variation is within what it has learned to handle."],
    evidence: ["The project shows household tasks including cooking, cabinet use, and elevator interaction. The paper compares performance with and without co-training and studies compatibility with different imitation methods.","Use the quantitative task results to assess consistency. A completed sequence shows feasibility in that trial; its duration and visual complexity do not reveal the number of failed attempts."],
    interpretation: ["Reader’s interpretation: this is a hardware, data-collection, and learning-system contribution. Attributing the whole result to a model architecture would miss the demonstration interface and the training mixture.","Separate error sources during evaluation: failure to reach a handle, failure to grasp it, and failure to coordinate the base are distinct. Improving one part may leave the overall task success rate limited by another."],
    limitations: ["The reported system is evaluated on particular tasks and environments with collected demonstrations. The results do not establish general household autonomy.","Ask what happens after an interruption or failed grasp. A policy trained primarily on successful trajectories may encounter unfamiliar states after its own mistakes. Long sequences create more opportunities for such errors to accumulate."],
    takeaway: "Coordinated demonstrations make coordinated imitation possible. The paper’s lesson concerns how the hardware and data-collection setup enable learning, as well as the policy trained on that data.",
    question: "Why does a successful teleoperated video not demonstrate autonomous competence?",
    answer: "During teleoperation the human chooses actions and handles surprises. Autonomous competence requires trials where the learned policy supplies those actions, with failures and intervention rules accounted for."
  },
  "genie-generative-interactive-environments": {
    title: "Learning controllable worlds from videos without action labels",
    source: "https://arxiv.org/html/2402.15391v1",
    project: "https://sites.google.com/view/genie-2024/home",
    sections: ["Introduction", "Method", "Training", "Experimental Results", "Discussion and Limitations"],
    foundations: ["A policy predicts what action to take. A world model predicts what might happen next, often given a current observation and an action. These can be complementary components, but generating a future image does not itself command a robot.","Genie asks whether videos without recorded button presses can teach a controllable environment. Ordinary video prediction can imitate likely motion. Interactive prediction needs a way for a chosen input to change what happens next."],
    terms: [["Latent action", "A hidden control representation inferred from changes in video, rather than a supplied label such as ‘left.’"],["Video tokenizer", "A model that compresses frames into representations for prediction and reconstructs images from them."],["Dynamics model", "A model of how a representation changes over time in response to a control input."],["Autoregressive generation", "Predicting the next output using earlier outputs, then repeating. Earlier mistakes can affect later predictions."]],
    problem: ["Genie combines a video tokenizer, a latent-action model, and a dynamics model. The latent-action component infers a compact description of a transition; the dynamics component learns to predict subsequent visual content using it.","This is an inference problem because many things change between frames. A compact code may capture a useful controllable change, but recovering useful controls is different from recovering the exact physical cause of every pixel change."],
    steps: [["Compress the starting frame", "The tokenizer maps visual content into a representation the dynamics model can process."],["Choose a latent control", "A user supplies a code from the learned action space. The code’s effect is learned from data rather than specified as a physical motor command."],["Predict and repeat", "The dynamics model generates the next visual representation. Decoding makes a frame, which becomes part of the context for further interaction."]],
    training: ["The main model is trained on platformer videos without ground-truth action labels. The paper also examines robot-video data, treating those recordings as videos rather than using their action annotations.","Without labels, the learning system must discover a useful organization of transitions. Code 0 has no inherent meaning such as ‘jump.’ Consistent effects can make codes usable for interaction even when their numbering is arbitrary."],
    example: ["Teaching example: two clips show the same character at the same starting point. In one, it rises; in the other, it moves sideways. A useful latent code distinguishes these transitions so a user can influence the generated continuation.","If both codes produce equally plausible but unrelated videos, realism alone has not established control. A world model needs to respond systematically to the chosen input. That still does not guarantee accurate physical behavior outside the training domain."],
    evidence: ["The paper evaluates visual fidelity and controllability, including a comparison between inferred and randomly chosen latent actions. It also investigates using learned actions for imitation from video.","These are world-model and agent-learning experiments. They should not be described as a demonstration that a real robot can execute arbitrary tasks learned from generated video."],
    interpretation: ["Reader’s interpretation: fidelity asks whether a video looks plausible; controllability asks whether the selected input has a meaningful effect. A system may improve on one without improving on the other.","A useful physical simulator would need additional validation: do predicted contacts, motion, and failure cases match the real system closely enough for the intended training use? A visually compelling scene cannot answer that question by itself."],
    limitations: ["The work is an early controllable generative environment, with limitations in visual quality and temporal consistency. Learned latent controls are not automatically calibrated robot actions.","Autoregressive errors can accumulate. If an object’s location drifts in an early frame, subsequent predictions may continue from that incorrect state. Longer interaction therefore needs evaluation beyond the quality of one generated frame."],
    takeaway: "Genie learns a controllable predictive environment from unlabeled video. Its contribution is about discovering useful action-conditioned dynamics, not replacing the need to validate real-world control.",
    question: "Can a generated world look realistic while teaching an agent the wrong behavior?",
    answer: "Yes. Visual realism can coexist with incorrect contact or motion rules. An agent may exploit those errors, so transfer to a real environment requires separate validation."
  }
};
