import type { LearningGuide } from './guides';

const sections: LearningGuide['sections'] = ['Abstract and introduction', 'Method and design', 'Training setup', 'Evaluation', 'Discussion and limitations'];
// Original teaching explanations grounded in the linked arXiv papers.
function guide(id: string, content: Omit<LearningGuide, 'source' | 'project' | 'sections'>): LearningGuide {
  return { source: `https://arxiv.org/abs/${id}`, project: `https://arxiv.org/abs/${id}`, sections, ...content };
}
export const addedGuides: Record<string, LearningGuide> = {
 'fast-action-tokenization': {
  source:'https://arxiv.org/html/2501.09747v1', project:'https://www.pi.website/research/fast',
  sections:['III · Preliminaries; V · Tokenization','IV · Case study; V-B · FAST algorithm','V-C · Universal tokenizer; Appendix C','VI · Experiments; Appendix E','VII · Discussion; Appendix B'],
  title:'FAST: give a robot a more useful action vocabulary',
  foundations:[
   'A robot movement is a sequence of numbers. For one joint, you might record a position at every instant; a whole robot adds more dimensions. An autoregressive model needs discrete symbols instead. FAST is the translator between these continuous movements and the symbols a model predicts.',
   'There are two routes through this system. During training, recorded action chunks become token targets. At deployment, images, an instruction, and robot state condition a policy that predicts tokens; decoding reconstructs the action chunk. The tokenizer does not decide which object to grasp.'
  ],
  terms:[['Action chunk','A short sequence of future robot commands predicted together.'],['Autoregressive','Predicting each next token conditioned on the input and previously generated tokens.'],['DCT · discrete cosine transform','A change of coordinates: describe a sampled curve with weighted cosine patterns rather than individual time samples.'],['Quantization','Rounding continuous coefficients to discrete values; this can introduce reconstruction error.'],['BPE · byte-pair encoding','A learned vocabulary that merges frequent adjacent symbol sequences into tokens.'],['FAST+','The reusable FAST tokenizer fitted on a broad mixture of robot trajectories, distinct from a complete robot policy.']],
  problem:[
   'Thesis: the way we encode robot actions changes what next-token prediction learns. With high-frequency data, neighboring actions can be almost identical. A model may learn to repeat nearby tokens instead of learning the movement implied by the observation.',
   'Why it matters: compressing the sequence can remove easy repetition and make autoregressive learning more effective. FAST changes the action representation rather than requiring an entirely new vision-language backbone. Compression and good physical decisions remain different objectives.'
  ],
  steps:[['Recorded action chunk','Normalize each action dimension, then treat its samples over time as a signal. This is the training-target encoding path.'],['Cosine coefficients','Apply a DCT along time for each action dimension. Smooth structure can be represented by relatively few strong coefficients.'],['Discrete symbols → tokens','Scale and round coefficients, serialize them, and use BPE to form a compressed token sequence.'],['Policy predicts tokens','Train an autoregressive VLA against these targets. At inference it predicts tokens from the current observation and instruction.'],['Decode → action chunk','Reverse BPE and serialization, undo scaling, apply the inverse DCT, and undo normalization to recover robot commands.']],
  training:[
   'Tokenizer fitting and policy training are separate jobs. FAST fits a symbol vocabulary; the policy learns which token sequence matches a situation. FAST+ supplies a vocabulary trained across many robot trajectories, so it can be reused instead of fitting one for each dataset.',
   'The policy objective is next-token prediction on encoded demonstration actions. The observation supplies task context. At deployment, the demonstration target is absent: predicted tokens are decoded into movement. A valid decoded sequence need not be a successful grasp.'
  ],
  example:[
   'Teaching example: imagine a gripper moving smoothly toward a cup, then making a brief correction. A low-frequency cosine captures the broad sweep. Higher-frequency components capture faster variation. Moving the slider below keeps more components and reconstructs more of the small correction.',
   'This isolates the transform, not the full FAST algorithm. Real FAST also rounds coefficients and uses BPE. The number of retained components in this illustration is not the number of FAST tokens, and this synthetic curve is not a measured robot trajectory.'
  ],
  evidence:[
   'The paper compares tokenizers in synthetic signal prediction and robot tasks, tests transfer of the reusable tokenizer, and compares autoregressive policies with diffusion policies. These answer different questions: reconstructing an action accurately is not the same as choosing a successful action.',
   'The authors report up to fivefold faster training in their comparison with diffusion-based VLAs. This is a training-compute result under their setup, not a claim that every robot moves five times faster. Some broad deployment demonstrations are qualitative rather than measured success-rate studies.'
  ],
  interpretation:[
   'Look for two comparisons: equal training compute and trained-to-convergence performance. They reveal different benefits. A method can learn faster while eventually reaching a similar level of task performance.',
   'For a tokenizer, inspect reconstruction fidelity alongside sequence length. Fewer tokens may reduce modeling work, but losing an important correction can matter physically. The paper studies a compression–reconstruction tradeoff; compression alone does not establish control quality.'
  ],
  limitations:['An autoregressive policy still generates a sequence token by token. Training efficiency does not remove that inference constraint or guarantee a particular control rate.','Action encoding cannot repair missing visual information, poor demonstrations, or unseen contact dynamics. Validate the entire policy and hardware loop, not only the decoded curve.'],
  takeaway:'FAST compresses continuous action chunks into a useful discrete vocabulary. Its claim connects representation, learnability, and training efficiency—not compression alone.',
  question:'If a tokenizer reconstructs every demonstration perfectly, have we solved robot control?',
  answer:'No. Reconstruction assumes the desired action is already known. A policy must choose the right action from observations, cope with unfamiliar situations, and execute through imperfect hardware.'
 },
 'clip-visual-language-pretraining': guide('2103.00020', {
  title:'CLIP: put images and words in a shared coordinate system',
  foundations:['A classifier usually chooses from labels fixed during training. CLIP instead compares an image with text descriptions, making the descriptions part of the prediction interface.','Picture a map where related images and phrases are nearby. The coordinates are learned numerical vectors, not a hand-drawn concept tree. This is a perception building block; it does not output robot commands.'],
  terms:[['Encoder','A model that converts an input into a numerical representation.'],['Embedding','The resulting vector used for comparisons.'],['Contrastive learning','Learning to distinguish matching pairs from nonmatching pairs.'],['Zero-shot classification','Choosing new task labels without training on examples labeled for that task.']],
  problem:['Thesis: paired images and natural-language text can train transferable visual representations.','Why it matters for robotics: text can become a way to refer to visual concepts. A controller still has to determine location, geometry, contact, and motion.'],
  steps:[['Image encoder','Convert a picture into an embedding.'],['Text encoder','Encode each candidate description separately.'],['Similarity comparison','Compare image and text embeddings; use their relative similarity to select a description.']],
  training:['Training uses matching image–text pairs and contrasting examples. Both encoders learn which associations distinguish a match.','At inference, candidate descriptions can change without retraining the encoders. Wording is therefore part of the prediction setup.'],
  example:['Teaching example: compare a photo with “a red cup,” “a blue bowl,” and “a folded towel.” The system ranks these descriptions by similarity.','Add “a red object” and consider why a broad description might compete with a specific one. A useful semantic match does not identify an exact grasp point.'],
  evidence:['The paper evaluates transfer across multiple visual tasks using language to specify classes. It compares against task-specific visual systems.'],
  interpretation:['Ask whether the evaluation supplies labels as prompts, fine-tunes a classifier, or updates the full model. These are different transfer settings.'],
  limitations:['A high image–text similarity is not a calibrated guarantee that the statement is true.','This is an image-representation method, not an embodied controller or proof of physical understanding.'],
  takeaway:'CLIP makes natural language a usable interface to learned visual representations.',question:'Why can recognizing a cup still be insufficient to pick it up?',answer:'A semantic match does not supply its 3D pose, a reachable grasp, the required force, or a collision-free movement.'
 }),
 'rt-1-robotics-transformer': guide('2212.06817', {
  title:'RT-1: learn one controller from many robot tasks',
  foundations:['A robot policy maps what a robot observes and is asked to do into executable actions. RT-1 studies scaling that mapping across many tasks.','Think of instruction, camera history, and action as separate interfaces. A policy must use visual feedback to distinguish what should happen from what has already happened.'],
  terms:[['Policy','A rule learned to choose actions from observations.'],['Transformer','A sequence model that combines information across tokens.'],['Demonstration','Recorded observations paired with actions performed during a task.'],['Generalization','Performance on situations beyond the exact training examples.']],
  problem:['Thesis: large and diverse robot experience, paired with a high-capacity sequence model, can support a shared multitask policy.','Why it matters: it provides a robot-data scaling baseline before studying transfer from web-trained vision-language models.'],
  steps:[['Observe + instruct','Provide camera observations and a language task instruction.'],['Encode context','Represent the relevant visual and task information for a transformer.'],['Predict robot action','Output action values in the policy’s control representation; repeat with updated observations.']],
  training:['The policy learns from robot demonstrations covering different tasks. The study varies model and data properties to examine generalization.'],
  example:['Teaching example: “move the can” and “open the drawer” share a camera and robot, but require different control sequences.','If a can changes position, memorizing an action sequence is insufficient. The policy must condition movement on the new observation.'],
  evidence:['The authors evaluate real robots and study effects of data size, diversity, and model class.'],
  interpretation:['Distinguish a new object arrangement from a new robot body. Success on one does not establish success on the other.'],
  limitations:['A shared policy still depends on the tasks and hardware represented in its data.','This is not a proof that a single policy can perform every instruction.'],
  takeaway:'RT-1 asks how far broad robot demonstrations can take one transformer policy.',question:'Why might more copies of the same demonstration help less than varied scenes?',answer:'Repeated examples reduce uncertainty about one situation; varied scenes expose the policy to different visual and physical conditions it must handle.'
 }),
 'act-low-cost-bimanual-manipulation': guide('2304.13705', {
  title:'ACT: learn short movements instead of isolated actions',
  foundations:['Fine manipulation needs coordinated movement and feedback. The ALOHA system collects demonstrations through low-cost two-arm teleoperation; ACT learns from them.','An action chunk is a short forecast of commands, not a complete task plan. Predicting a chunk allows the model to represent movement over time.'],
  terms:[['Bimanual','Using two robot arms together.'],['Teleoperation','A person controls a robot to perform and record a task.'],['Imitation learning','Learning to predict demonstrated behavior.'],['Action chunk','A sequence of consecutive commands predicted together.']],
  problem:['Thesis: a learned generative model of action sequences can support fine manipulation with inexpensive hardware and limited demonstrations.','Why it matters: hardware cost and temporal errors are both barriers to collecting and learning useful robot skills.'],
  steps:[['Human demonstrations','Record camera observations, robot state, and actions during teleoperation.'],['Predict an action chunk','Condition a transformer-based policy on the observed situation to generate a sequence of commands.'],['Execute with new observations','Apply control and update predictions as the scene changes.']],
  training:['Demonstrations provide paired observations and target action sequences. The method models chunks rather than treating every time step as an unrelated prediction.'],
  example:['Teaching example: inserting a battery needs alignment, approach, and contact. A chunk can describe the near-term coordinated movement.','If the battery slips, the previously predicted sequence may no longer fit. Chunking is not permission to ignore feedback indefinitely.'],
  evidence:['The paper tests fine manipulation on real low-cost hardware, including contact-sensitive tasks.'],
  interpretation:['Read how demonstrations were collected and how success was scored. A short training dataset can still require skillful human demonstrations and a carefully arranged task.'],
  limitations:['Errors can accumulate if a policy leaves the demonstrated situations.','Coordinated actions do not guarantee correct force or recovery after unexpected contact.'],
  takeaway:'ACT turns demonstration learning into short sequence prediction for coordinated manipulation.',question:'Does a longer action chunk always improve control?',answer:'No. It can capture temporal structure, but executing a long prediction without fresh feedback can make the controller less responsive to change.'
 }),
 'saycan-grounded-language-planning': guide('2204.01691', {
  title:'SayCan: combine useful instructions with feasible robot skills',
  foundations:['A language model can suggest a sensible next step without knowing whether this robot can execute it. SayCan separates semantic usefulness from physical feasibility.','The system selects among existing skills. It does not turn an arbitrary sentence into a new motor behavior on demand.'],
  terms:[['Affordance','Whether a skill is feasible in the current situation.'],['Value function','A learned estimate associated with performing a skill successfully.'],['High-level planner','Chooses steps rather than directly controlling every motor.'],['Grounding','Connecting language choices to an agent’s actual capabilities and environment.']],
  problem:['Thesis: combine language-based task relevance with skill feasibility when selecting robot actions.','Why it matters: plausible verbal plans can be physically impossible. The planner needs evidence about what the robot can do now.'],
  steps:[['Instruction → candidate skills','Use language knowledge to assess useful next steps.'],['Check feasibility','Estimate which available skills are achievable in the current scene.'],['Select and execute','Combine these signals, run a selected skill, then plan the next step.']],
  training:['Low-level skills and their value estimates provide the connection to real behavior. Language knowledge supplies information about task sequences.'],
  example:['Teaching example: cleaning a spill could involve fetching a sponge. If the sponge is unreachable, a linguistically sensible step has poor physical feasibility.','The system needs an available alternative skill or a changed situation; fluent wording cannot make an unreachable sponge reachable.'],
  evidence:['The authors evaluate high-level instructions on real robotic tasks and examine the value of physical grounding.'],
  interpretation:['Separate errors in selecting a step from errors in executing it. A correct plan can still fail through a weak motor skill.'],
  limitations:['Coverage is limited by the available skill set and reliability of feasibility estimates.','A score for feasibility can itself be wrong in an unfamiliar scene.'],
  takeaway:'SayCan joins a language planner to learned physical capabilities.',question:'Why not always pick the step the language model rates highest?',answer:'The most relevant step may be impossible for this robot in this scene. A feasibility signal can reject it before execution.'
 }),
 'dreamerv3-world-models': guide('2301.04104', {
  title:'DreamerV3: practice inside a learned model of the world',
  foundations:['A world model predicts how an environment changes. Dreamer learns such a model from interaction, then uses imagined experience to improve behavior.','Its imagined states are internal representations. The agent is not necessarily generating photorealistic movies each time it considers an action.'],
  terms:[['Latent state','A compact learned representation of the environment.'],['Rollout','A sequence of predicted or observed states and actions.'],['Reward','A task signal indicating desirable outcomes.'],['Model-based RL','Reinforcement learning that uses a learned or provided environment model.']],
  problem:['Thesis: a robust world-model learning recipe can support one reinforcement-learning algorithm across diverse domains.','Why it matters: imagined practice can provide training experience beyond each direct interaction, but only to the extent the learned model is useful.'],
  steps:[['Collect experience','Observe environment transitions and rewards produced by actions.'],['Learn dynamics','Train a model of how latent states and rewards evolve.'],['Imagine and improve','Generate predicted rollouts to train behavior; collect new real experience to improve the model.']],
  training:['Environment data trains the world model. Imagined trajectories support learning the behavior and value estimates. These are linked but distinct updates.'],
  example:['Teaching example: an agent imagines two paths to a reward before trying one. A short path may look attractive because its model omits a hazard.','Real feedback can reveal the error. Repeated imagination without correcting the model can reinforce a mistaken strategy.'],
  evidence:['The paper evaluates one algorithm configuration across diverse tasks and reports learning challenging behavior in Minecraft.'],
  interpretation:['Diversity across benchmark domains is different from evidence that the same trained policy transfers unchanged to every domain.'],
  limitations:['A policy can exploit errors in its learned model.','Success in an interactive benchmark does not establish reliability for physical contact on a real robot.'],
  takeaway:'Dreamer learns a model to make imagined experience useful for policy learning.',question:'Why must the agent keep collecting real experience?',answer:'Its model can be wrong or incomplete. New observations reveal those errors and provide evidence for correcting its predictions.'
 }),
 'general-purpose-robots-survey': guide('2312.08782', {
  title:'A map of how foundation models enter a robot system',
  foundations:['This is a survey, not one proposed robot architecture. Its job is to organize approaches and identify barriers to general-purpose robotics.','Use the diagram as a conceptual map: perception interprets observations, planning chooses goals or steps, and control produces motion. Different papers place a foundation model in different parts of this loop.'],
  terms:[['Foundation model','A broadly pretrained model reused or adapted for downstream tasks.'],['Embodiment','The body, sensors, and action capabilities of an agent.'],['Distribution shift','A change between training conditions and deployment conditions.'],['Taxonomy','An organizing scheme for comparing approaches.']],
  problem:['Thesis: studying where foundation models are used helps clarify their contribution and the remaining barriers to general-purpose robots.','Why it matters: recognizing an object, planning a task, and controlling contact are different capabilities, even when all involve a large model.'],
  steps:[['Perception','Interpret images, language, and other observations. This is one possible foundation-model role.'],['Reasoning and planning','Connect goals to steps or intermediate representations.'],['Action and feedback','Execute motor behavior and observe what actually happened. This map is not a single architecture proposed by the survey.']],
  training:['A survey reviews multiple training approaches rather than training one unified system. Compare what each reviewed method inherits from pretraining and what robot-specific data it still needs.'],
  example:['Teaching example: put three papers on this map. CLIP provides visual-language representations; SayCan selects feasible skills; Diffusion Policy predicts action sequences.','They can address related tasks while making different contributions. Comparing only model size would hide those differences.'],
  evidence:['The source organizes research on adapting existing foundation models and developing robotics-specific ones. It discusses generalization barriers and directions for research.'],
  interpretation:['Treat the taxonomy as a reading aid. For experimental claims, follow the cited original study and its evaluation setup.'],
  limitations:['A survey is a snapshot of its literature coverage, not an exhaustive current leaderboard.','A category label does not prove that different methods share the same data, output interface, or evaluation task.'],
  takeaway:'Locate each paper’s contribution in the observation–reasoning–action loop before comparing it.',question:'Why is a language-planning paper not a substitute for a motor-control paper?',answer:'Selecting a meaningful step and producing reliable physical movement solve different parts of the robot system.'
 }),
 'dinov2-visual-representations': guide('2304.07193', {
  title:'DINOv2: learn visual features without task labels',
  foundations:['A visual encoder can be reused across tasks if its features preserve useful structure. DINOv2 investigates self-supervised pretraining at scale.','Think of an encoder as a reusable measuring instrument for images. A downstream system still decides how to turn its measurements into segmentation, recognition, or robot actions.'],
  terms:[['Self-supervised learning','Learning a training signal from the data rather than a human-provided task label for every example.'],['Visual feature','A numerical representation of an image or image region.'],['Distillation','Training a student model using information from another model.'],['Downstream task','A task performed using the learned representation.']],
  problem:['Thesis: scaled self-supervised pretraining and curated image data can produce broadly useful visual features.','Why it matters: robot systems can reuse perception representations instead of learning all visual structure from scarce demonstrations.'],
  steps:[['Curate image data','Build a diverse visual training collection.'],['Pretrain visual model','Learn reusable features with self-supervised objectives.'],['Transfer features','Use the encoder, including distilled smaller models, in downstream systems.']],
  training:['The paper combines data curation and methods for stable large-scale self-supervised training. Distillation makes learned capabilities available in smaller encoders.'],
  example:['Teaching example: two photos show the same chair under different lighting. Useful features should preserve relevant structure despite the lighting change.','For grasping, however, preserving “chair-like appearance” may be less useful than retaining precise geometry at a contact point.'],
  evidence:['The authors evaluate visual features across image-level and pixel-level tasks.'],
  interpretation:['Ask whether features are used frozen or adapted. A useful frozen representation and a fine-tuned system demonstrate different forms of transfer.'],
  limitations:['Visual benchmark performance alone does not establish robot-control performance.','Reusable features may still discard information needed by a particular sensor setup or fine manipulation task.'],
  takeaway:'DINOv2 is a perception component that learns reusable visual representations.',question:'Does a better image encoder automatically make a better robot?',answer:'No. The policy must use its features, the data must cover the task, and the representation must retain the physical details the controller needs.'
 }),
 'droid-robot-manipulation-dataset': guide('2403.12945', {
  title:'DROID: diversify the places where robot experience is collected',
  foundations:['DROID is a dataset and collection effort, not a new policy architecture. Its central question concerns the diversity of real robot experience.','A demonstration connects what a robot sees with what action it takes. Collecting those pairs in varied scenes exposes learning systems to more than one laboratory’s background and object arrangements.'],
  terms:[['Trajectory','A recorded sequence of observations and actions.'],['Scene diversity','Variation in environments and visual arrangements.'],['Teleoperation','Human control used to perform and record robot behavior.'],['Held-out evaluation','Testing on examples or conditions excluded from training.']],
  problem:['Thesis: collecting manipulation experience across many real environments can improve the coverage of robot training data.','Why it matters: a large number of demonstrations in one setting may leave a policy unprepared for a different room or camera view.'],
  steps:[['Distributed collection','Use a shared collection setup across varied real scenes.'],['Aligned demonstrations','Record observations and robot actions as trajectories.'],['Policy learning and evaluation','Train with the collected data and test behavior beyond the exact training examples.']],
  training:['The dataset supplies demonstrations to policy-learning methods; it is not itself a model that chooses actions. Keep the dataset contribution separate from the particular policy trained on it.'],
  example:['Teaching example: compare collecting every demonstration at one kitchen counter with collecting across kitchens that vary in lighting and layout.','The second collection offers more environmental variation, but it still needs usable action labels and enough examples of the target task.'],
  evidence:['The paper introduces a multi-scene manipulation dataset and evaluates policy learning with it. The release includes data and supporting collection resources.'],
  interpretation:['Check what is held out: scene, object, instruction, or task. “Unseen” is meaningful only when that split is specified.'],
  limitations:['Broader coverage is not coverage of every robot body or physical task.','Data quality, task distribution, and compatibility with the target controller still matter.'],
  takeaway:'DROID expands the environmental diversity available for learning robot manipulation.',question:'Why is dataset size alone not enough to choose training data?',answer:'The same count can hide repeated easy scenes, missing tasks, noisy labels, or actions incompatible with the target robot.'
 }),
 'domain-randomization-sim-to-real': guide('1703.06907', {
  title:'Domain randomization: make visual variation part of training',
  foundations:['Simulation is convenient for generating labeled images, but its appearance differs from real camera images. This visual gap can break a trained detector.','Domain randomization varies rendered scenes so the learner cannot rely on one simulated appearance. The real world is intended to fall within the variation the model can tolerate.'],
  terms:[['Domain','A distribution of input conditions, such as simulated or real images.'],['Reality gap','Differences between simulated training and physical deployment.'],['Randomization','Varying selected scene properties during data generation.'],['Object localization','Estimating where an object is, rather than only identifying its category.']],
  problem:['Thesis: varied synthetic visual training can produce object localization that transfers to real images.','Why it matters: simulation can supply many labeled examples without manually labeling each real camera frame.'],
  steps:[['Render varied scenes','Randomize simulated visual properties to generate diverse images.'],['Train localization','Learn to infer object location from synthetic images and labels.'],['Transfer to real camera','Apply the detector to real images and use its estimates in a robot system.']],
  training:['The detector learns from synthetic observations with known labels. Randomized appearance discourages reliance on a single visual shortcut.'],
  example:['Teaching example: if every simulated target is on a checkerboard, a detector may associate the target with that background. Varying textures makes that shortcut less reliable.','Randomizing texture does not automatically teach how a slippery object responds to contact. Visual transfer and dynamics transfer are distinct problems.'],
  evidence:['The paper studies object localization from simulated visual training and demonstrates its use in real robotic grasping.'],
  interpretation:['Trace the evaluated transfer: a detector transfers from synthetic images to a real camera. Do not broaden that into a claim that every part of a robot policy transfers.'],
  limitations:['Randomized properties must cover variation relevant to the intended deployment.','Robust visual localization does not guarantee correct grasp forces or collision-free control.'],
  takeaway:'Vary synthetic appearance to help a visual model survive the transition to real images.',question:'Would randomizing colors solve an incorrect friction model?',answer:'No. Color variation addresses appearance; friction changes contact dynamics and needs its own modeling and validation.'
 })
};
