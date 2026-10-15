# About the ai series

A series of four notes that explains how language models work to a reader with school math who has never trained a model. Each note follows one everyday example and ends with something that runs in the page. Code is there for readers who know JavaScript, and the prose never depends on it. The code grows from note to note, and by the last one the reader trains a small GPT in their own browser tab, on real text.

The execution plan is `docs/ai-series/plan.md`. This file says what the series teaches and why it is shaped this way.

## Four notes instead of three

The request had three notes. The first held neural nets, terminology, and transformers. The second held a transformer implementation. The third trained a tiny model on real text.

Attention only makes sense once a reader knows that a language model predicts the next token, and that a token is a piece of text with an id for which the model learns a list of numbers. Neither idea fits into a note about neurons without doubling its length. A transformer implementation with nothing to train is also a note without a payoff. So the series moves those two ideas into a note of their own, merges "transformers explained" with "transformers implemented", and keeps the trained model as the finale.

| Requested | Proposed |
| --- | --- |
| 1. neural nets, terminology, transformers | 1. how a machine learns |
| (missing) | 2. words as numbers |
| 2. transformer implementation | 3. paying attention |
| 3. a tiny model on real text | 4. a tiny gpt, trained in your browser |

The first note still opens with a five-sentence map of the whole road. A reader who stops after note 1 knows that a model like ChatGPT predicts the next token, learns by the method note 1 shows, and is built from transformer blocks.

A three-note version is possible by folding note 2 into note 3. Note 3 then teaches tokens, embeddings, next-token prediction, and attention at once, and it becomes the longest and hardest note in the series. Four notes is the better trade.

## What each note teaches

Each note answers one question, follows one everyday example, introduces a fixed set of terms, and ends with a glossary of exactly those terms.

### 1. how a machine learns

The question is how a computer works out a rule that nobody told it.

The note follows one example from start to end. A taxi ride costs a starting fee plus a price per kilometer. The machine sees eight old rides, each with a distance and what the rider paid, and has to find the fee and the price on its own. Once that works, a second example shows why one straight line is not always enough.

After the note, a reader can answer these five questions. A lane in ai-06 checks the note against them.

1. In the taxi example, what are the model's parameters? The starting fee and the price per kilometer.
2. What does the loss measure? How far the guesses are from what riders really paid, as one number.
3. Why does the machine walk downhill step by step instead of jumping to the lowest point? The fare rule has a shortcut formula that finds its bottom directly. A neural network's valley is usually lumpier, with no formula for its bottom, so the machine feels the slope where it stands and walks. The walk may stop in a low spot that isn't the lowest.
4. What goes wrong when the learning rate is too big? Each step overshoots the bottom, and sooner or later the steps land higher than they started, so the loss grows.
5. Why can't one neuron tell comfortable days from uncomfortable ones? One neuron draws one straight fence, and the comfortable days sit in the middle.

Terms, in the order the note meets them: model, parameter, weight, bias, prediction, loss, gradient, learning rate, gradient descent, training, inference, backpropagation, neuron, activation function, layer, network.

1. **Guess the fare.** A chart of eight rides, distance across and fare up. They are made-up rides in a made-up city, and some sat in traffic, so no straight line touches all of them. Two sliders set the starting fee and the price per kilometer, and the guess is the line they make. Each ride's miss is drawn as a square whose side is the miss. The reader drags the sliders to make the squares small. The number under the chart is the average area of the squares, and that number is the loss. Squares, because a miss of 4 then counts four times as much as a miss of 2, and a guess that is too high cannot cancel one that is too low. Then the prose names what the reader just used. The rule is the model. The two knobs are its parameters. The price per kilometer is a weight, because it scales the input. The starting fee is a bias, because it moves every guess by the same amount. The fare the line gives for a ride is a prediction. 2D canvas.
2. **Downhill in fog.** Every setting of the two knobs has a loss. Lay all the settings out as a floor, the fee one way and the price the other, and raise each spot by its loss. The result is a valley, and the best settings sit at the bottom. A cube stands at the reader's current settings. The picture squeezes the tall parts so the whole valley fits. The machine never sees this picture, because with millions of knobs nobody can draw it. The fare rule even has a shortcut formula for its bottom, but a neural network's valley is usually lumpier, with no formula for its bottom, so the machine learns to walk. Walking downhill still works on a lumpy valley, though it may stop in a low spot that isn't the lowest. It is like standing on a hill in thick fog and feeling which way the ground slopes under your feet. A fog switch hides everything except the ground near the cube. A step button moves the cube one step downhill. A step size control offers steps so small they crawl, a good size, a size that zigzags, and a size so big that, from where the cube starts, every step lands higher than the last. Any step size above the limit the caption shows climbs out of the valley sooner or later, even when the first few steps look fine, unless it starts right at the bottom. The slope under your feet is the gradient. Each step moves every knob against its slope, and the learning rate says how much, so steeper ground or a bigger learning rate means a bigger step. Walking downhill this way is gradient descent, and walking until the loss stops getting much smaller is training. Afterwards the chart beside the landscape shows the line the machine found, and the prose asks it the fare for a 1.6 km ride, which is not among the eight but sits inside their range. The sentence computes the answer from the rounded numbers it shows. That is inference. three.js, because the height is the loss.
3. **Which way is downhill?** The fare for one ride is worked out like a receipt, one line per step. Distance times price per kilometer, plus the starting fee, minus what the rider paid, and that miss times itself. The reader nudges the price per kilometer up by one cent and watches the bottom line change. The change divided by one cent is very close to the slope for that knob, and the backward walk below gives almost exactly the same number. Nudging millions of knobs one at a time would take forever. So the machine walks the receipt from the bottom line up, and each line works out its slope from the line below it, like tracing a wrong total back to the items that caused it. That walk backwards is backpropagation. The `Value` class, about 60 lines, does this for any calculation, and its code follows for readers who want it. An HTML table.
4. **When a straight line isn't enough.** A new question. Is a day comfortable indoors? Each dot is a day, temperature across and humidity up, filled if people said comfortable and hollow if not. The comfortable days sit in the middle, not too cold, not too hot, not too dry, not too damp. The taxi rule with a weight for each input, a bias, and a squash at the end is one neuron. The squash makes big sums level off, and the last neuron squashes its answer to between 0 for no and 1 for yes. A neuron draws one straight fence across the chart and says how far onto the yes side a day is. One fence cannot pen in the middle. Wherever it runs, the side that holds all the comfortable days holds some uncomfortable ones too. A layer is several neurons side by side, so several fences. Each neuron hands its number to every neuron in the next layer, which weighs them, adds its bias, and squashes again. So a second layer reads those fences and joins them into a shape, and four fences make a box around the comfortable days. The squash is the activation function. Without it, stacking fences only ever makes another straight fence. Layers in a row are a network. Before the reader presses train, the prose says two things in plain words. For a yes or no answer, this demo scores its guesses a little differently than the squares, and part 2 explains how. Its steps also remember the last few slopes, a common trick called adam, so it gets there faster. The reader presses train and watches the shape form. Each first-layer neuron's knobs are a row of squares. A filled square is a positive number and a hollow one is a negative number. A bigger square is a number farther from zero. The layers after it decide what those numbers do to the answer. Pointing at a row draws that neuron's fence on the chart. Three more charts sit behind a picker. In this hallway the light is on when exactly one switch is up, and no single fence can split that. Its dots are repeats of the four switch settings, spread a little so they can be seen. Two separate groups need only one fence. A spiral is the hard one. 2D canvas.

Code shown, for readers who know JavaScript: `Value`, `Neuron`, `Layer`, `MLP`, and the short training loop that trains the playground, with its cross-entropy loss and adam step.

The first section should read like this. It is the voice target for ai-06.

> a taxi ride costs a starting fee plus a price for every kilometer. if the fee is 3 dollars and a kilometer costs 2, a 5 kilometer ride costs 3 + 5 × 2 = 13 dollars.
>
> now turn it around. you have eight old rides from another city. you know how far each one went and what you paid, but nobody tells you the fee or the price. can you find a fee and a price that guess these fares well?
>
> the chart has your eight rides. the line is your guess. move the two sliders until the line runs close to every ride. each square shows how far off the guess is for one ride, so a bad guess has big squares. no line touches every ride, because some of them sat in traffic.
>
> that is all learning means here. there is a rule with a few knobs, and the machine looks for the knob settings that make its guesses close to what really happened.

### 2. words as numbers

The question is how a computer reads and writes text when all it can do is arithmetic.

The example is the row of word suggestions above a phone keyboard. It guesses your next word from the words so far. The note builds the simplest version of that guess, one letter at a time, from 32,000 first names.

After the note, a reader can answer these five questions. A lane in ai-09 checks the note against them.

1. What does a language model do? It guesses what comes next, one piece of text at a time.
2. What is a token? One piece of text that the model reads as a unit and gives a number of its own, like a dish on a takeaway menu.
3. How does the counting model guess the letter after "q"? It looks up which letters followed "q" in all the names, and how often.
4. What does the temperature control change? How often the model picks an unlikely letter. Low picks the letters the model already likes, so the names come out samey. High spreads the choices out, so the names get strange.
5. Why does each letter get a list of numbers instead of one number? So letters that behave alike can sit close together, and what the model learns about one helps with the others.

Terms, in the order the note meets them: token, vocabulary, tokenizer, next-token prediction, probability, sampling, temperature, logits, softmax, cross-entropy, context, embedding.

1. **Cutting text into pieces.** A computer can only add and multiply, so text has to become numbers first. Cut the text into pieces and give each piece a number, the way a takeaway menu numbers its dishes. A piece is a token, the whole menu is the vocabulary, and the thing that does the cutting is a tokenizer. The demo cuts one sentence three ways. Letters make a tiny menu but long orders. Whole words make short orders, but the menu is too big to print and a new word is not on it. Pieces of words, like "un", "believ", and "able", sit in between, and that is what ChatGPT uses. This note uses letters, because 27 tokens fit on one screen. Text only.
2. **The counting model.** Guessing what comes next is next-token prediction, and the simplest way to do it is to count. Go through 32,000 names and count which letter follows which. After "q" comes "u" about three times out of four (measured, 206 of 272 in `names.txt`). Every count starts at one, so every letter keeps a small chance. The demo draws the counts as a grid, one row for each letter and one column for the letter after it, each square as big as its count. A dot marks where a name starts and ends. Type a letter and its row lights up with each next letter's share, its probability. To write a name, the model rolls a loaded die. Each letter gets sides in proportion to its share in the current row. Roll, write the letter down, move to that letter's row, and roll again until the end dot comes up. That is sampling. The temperature control loads the die. Turned down, the letters the model already likes get even more sides, and the names come out samey. Turned up, the choices spread out toward the same number of sides each, and the names get strange. 2D canvas.
3. **Learning instead of counting.** The same guess, made by a network like the one in part 1 instead of by counting. For the letter it just read, the network gives every possible next letter a score. Those raw scores are the logits. They can be any number, so softmax turns them into chances that add up to 100%. It raises a fixed number, about 2.72, to the power of each score, which makes every score positive and makes the big ones count a lot more. Then it divides each by the total. Scores of -1, 0 and 1 become chances of 9%, 24% and 67%. The loss is cross-entropy, which measures how surprised the model was by the letter that really came next. Giving that letter a 50% chance is a small surprise, and giving it 1% is a big one. Training lowers the average surprise. The demo's loss falls to the counting model's loss and flattens there, because a model that sees only one letter knows no more than the counts do. Same chart as part 1.
4. **Letters on a map.** To do better, the model has to see further back. How far back it sees is its context. Give it three letters. Each letter now gets a list of three numbers that training adjusts, like coordinates on a map. That list is the letter's embedding. Letters that turn up in the same kinds of places often drift close together. Watch whether the vowels find each other. The 3D view draws those three learned numbers directly as the three axes while it trains. The cloud at the top of every page on this site is a hand-built toy of the same idea, where nothing is trained. This demo trains one for real. three.js, training in a Web Worker.

Code shown, for readers who know JavaScript: the tokenizer, the counting model, softmax and cross-entropy, the one-letter model, and the three-letter model.

The note opens like this.

> your phone's keyboard guesses your next word. it has seen a lot of text, and it knows which words tend to follow which. chatgpt does the same thing at a much bigger size. it guesses what comes next, writes it down, and guesses again.
>
> we'll build the smallest version of that guess. it reads one letter and guesses the next one, and it learns from 32,000 first names.
>
> first, a problem. a computer can only do arithmetic, and a letter is not a number. so we give each letter a number, the way a takeaway menu numbers its dishes.

### 3. paying attention

The question is how a word works out which earlier words matter to it.

The example is one sentence, "the bag didn't fit in the car because it was too small". To make sense of the end of the sentence, the word "small" has to look back and find what was too small, the bag or the car. Change "small" to "big" and the answer flips to the bag. Both nouns come before "small", so a model that only looks back can still use them. Attention is how each word looks back. The tiny model in this series is too small to solve that sentence. So the sentence explains why attention exists, and the demos show what the tiny model really looks at.

After the note, a reader can answer these five questions. A lane in ai-12 checks the note against them.

1. Why isn't three letters of context enough? The word that matters can be far back, like "bag" for "small".
2. What do the query, the key, and the value do? The query is what a word is looking for. A key is the label each earlier word shows. A value is what a word hands over when it matches.
3. Why can a word only look back? The model writes one piece at a time, so the words after it do not exist yet.
4. Why does a model have several heads? Each head can learn to look for something different, and they all look at the same time.
5. What happens to a word's numbers inside a transformer block? Attention adds what the word found in earlier words, and a small network adds more. Each change is added to the numbers already there, so the old numbers always have a straight path through, and a change can strengthen or weaken them.

Terms, in the order the note meets them: query, key, value, dot product, attention weights, causal mask, position embedding, head, multi-head attention, residual connection, layer normalization, transformer block.

1. **A soft lookup.** Think of a library search. You type what you are looking for, the query. Each book has a label on its spine, its key, and what is inside, its value. A normal search hands back the one best book. Attention reads a little of every book, and more of the ones whose labels match better. How well a label matches is the dot product. Multiply two lists of numbers pair by pair and add the results. The total is bigger when the arrows point the same way, and longer arrows count more. Part 2's softmax turns the match scores into shares that add up to 100%, and those shares are the attention weights. Each word's query, key, and value come from its own list of numbers through three sets of learned knobs, the same knobs at every position. The demo puts four words from the sentence on a flat chart as arrows, with each arrow's length visible. The reader drags the arrow for "small", and bars show how much "small" reads from each earlier word. The real model also divides each score by a fixed number, and only the code section mentions it. 2D.
2. **No peeking.** When the model writes, the next word does not exist yet, so a word may only look back. The demo shows one sentence's attention as a triangle of squares, one row per word, with nothing above the diagonal. That rule is the causal mask. Hover a row to read it. Attention on its own does not know which word came first, so each position also gets a learned list of numbers added in, its position embedding, like a seat number. 2D.
3. **Several readers at once.** One attention makes one mixture of what it reads. A model runs several side by side, each with its own queries and keys, so one can learn to watch the letter just before while another learns to look for the start of the word. Some heads may end up overlapping. Each one is a head, and together they are multi-head attention. The demo loads a model trained ahead of time with part 4's trainer. Hover a letter to see where each head looks, drawn as arcs. 2D.
4. **The block.** Each word carries a list of numbers through the model, like a notebook. Attention reads the notebooks and writes a note into each one, and then a small network like part 1's writes another. Each block adds its change to the numbers already there, so the old numbers always have a straight path through. The change can strengthen or weaken what was there. That adding is the residual connection. Before attention or the small network reads a notebook, it gets a copy turned to a steady size, like the auto volume on a tv that keeps every channel equally loud. That is layer normalization. Attention, the small network, and the notebook together are one transformer block. Stack a few blocks and the result is a transformer. After the last block, one more set of knobs turns each notebook into a score for every possible next letter, and part 2's softmax turns the scores into chances. The demo steps through one block and shows each word's notebook change twice. SVG by default. A 3D version (words by blocks by numbers) is worth one prototype in that PR, and it ships only if it reads better than the diagram.

Code shown, for readers who know JavaScript: attention in about 30 lines and the block in about 20.

The note opens like this.

> read this sentence. "the bag didn't fit in the car because it was too small." what was too small? the car. now change one word. "the bag didn't fit in the car because it was too big." now the bag was too big.
>
> you did that without thinking. when you reached "small", you looked back at the earlier words and picked the one that fit. a model has to do the same, and the way it does it is called attention.

### 4. a tiny gpt, trained in your browser

The question is what happens when all the pieces are put together and trained on real text.

The example is the phone keyboard from part 2, trained on shakespeare's plays instead of names. The reader presses train, and in about two minutes on a laptop, noise turns into lines that look like a play.

After the note, a reader can answer these five questions. A lane in ai-14 checks the note against them.

1. What happens in one training step? The model reads a handful of short passages and guesses every next letter. It averages its surprise over the batch, works out every knob's slope, and turns the knobs. The trainer is adam, which also remembers recent slopes.
2. Why does the model never train on some of the text? That text is the exam. It shows whether what the model learns on the practice text carries over to text it never trains on.
3. What does overfitting look like on the chart? The practice line keeps falling while the exam line flattens or rises.
4. What does load the trained one load? A checkpoint, the saved knob settings of the same model after longer training, about 120 KB.
5. What separates this model from ChatGPT? Far more knobs, far more text, and a second round of training on example conversations plus feedback on which answers people preferred. None of it makes the answers true.

Terms, in the order the note meets them: batch, step, training loss, validation loss, overfitting, checkpoint, parameter count, scale, pretraining, fine-tuning.

1. **Press train.** The model from parts 2 and 3 trains in the background, in a Web Worker. Each step it reads a handful of short passages picked at random, a batch, like practicing on a few flash cards instead of the whole deck. The training text is its own answer key. Reading "to be", the model sees "t" and must guess "o", sees "to" and must guess " ", and so on, every position at once. Part 3's causal mask keeps this fair, because no position can see its own answer. The model averages its surprise over the batch, works out every knob's slope, and turns the knobs. The trainer here is adam, which also remembers recent slopes, so its steps are smoother than part 1's plain walk. That is one step. The chart draws two lines. The practice line is the training loss, on the text the model trains on. The exam line is the validation loss, on a tenth of the text it never trains on. If the practice line keeps falling while the exam line stops, the model is picking up quirks of the practice text that don't carry over to new text, like learning the practice cards by heart instead of the subject, and that is overfitting. Every few seconds a sample from the current knobs appears under the chart. To write, the model picks a letter with part 2's loaded die, feeds it back in, and picks again. It reads at most the last 64 letters, and writing never changes the knobs. The samples go from noise to letters to words. On the laptop the prototype ran on, a 30,000-knob model writes lines that look like shakespeare after about two minutes of training. The chart counts steps, not seconds, so a slower device draws the same lines, only later.
2. **Load the trained one.** A checkpoint is the saved knob settings, like a save file in a game. This one is the same model trained offline for 12,000 steps, and it weighs about 120 KB. The button is there from the start, so nobody waits on a slow laptop. The file loads only when the reader asks.
3. **What it learned.** Its letters on part 2's map and its heads as part 3's arcs, drawn from the reader's own trained knobs. This model gives each letter 32 numbers, not three, so the map shows them squeezed down to three directions that keep the biggest differences, and the prose says so. The map takes the alphabet as a setting, 27 symbols for names and 39 for lowercase shakespeare.
4. **From here to ChatGPT.** The number of knobs is the parameter count. A table puts this model next to GPT-2 and GPT-3 by knobs and by how much text each one read, from their published papers. Growing both is scale. Reading a huge amount of text to guess the next piece is pretraining, and it gives a model that continues text. Further training of a model that already exists is fine-tuning. A second, shorter training on example conversations, plus feedback on which answers people preferred, turns it into an assistant. None of it makes the answers true. Bigger tokenizers are the third thing the series skipped.

The note opens like this.

> everything so far fits on one page. a model is a rule with knobs. training turns the knobs a little downhill, again and again. letters become lists of numbers, and attention lets each letter look back. now we put it all together and let it read shakespeare.
>
> press train. the model knows nothing yet, so the first lines are noise. keep an eye on the faint line in the chart. it is the exam, text the model never practices on.

## Shared rules

### Everyday example first, name second

Each idea arrives as something the reader already knows, such as a taxi fare, a hill in fog, or a receipt, and only then gets its name. "The price per kilometer is what people call a weight." A term never appears before the thing it names. Each glossary row explains its term through the note's example, as in `weight` with "a knob that scales an input, like the price per kilometer".

### The prose works without the code

Code blocks are for readers who know JavaScript. A reader who skips every one of them still follows the note, because the prose and the demos carry each idea on their own.

### The code a reader sees is the code that runs

Code blocks in a note come from the files that run its demos. A fenced block names a file and a region, and the build copies the region in. If the region is missing, the build fails. The reader can trust that the `backward` they read is the `backward` that trained the network above it.

### 3D only where depth carries a number

Two demos use three.js: the loss landscape, where height is the loss, and the embedding space, where in part 2 each letter's three learned numbers are its position on the three axes. Part 4 reuses that map for 32 numbers per letter, squeezed down to three directions by PCA, and says so. Everything else is 2D canvas, SVG, or HTML. PRODUCT.md names "demos that exist to impress the designer audience rather than serve the reader" as an anti-reference.

### Sign without color

The site has no accent color, so the usual red for negative and blue for positive is not available. Sign is a shape. A filled square is positive and a hollow square is negative, as in a Hinton diagram. Magnitude is the size of the square or a tone between `bg` and `ink`. A dashed line is a negative weight where a line is the right mark.

### Every demo behaves like the skyline

- The server renders a shell with a fixed aspect ratio and a text description, so the page does not jump and works without JavaScript.
- The demo's code, including three.js, loads as its own chunk when the shell comes within 200px of the viewport.
- It pauses when it is off screen or the tab is hidden.
- Under reduced motion nothing runs on its own. Step buttons still work.
- A 3D demo without WebGL falls back to a still image or a 2D version.
- It has an accessible name and a visually hidden description of what it shows.
- Prose stays 37rem wide. A demo may widen to the 80ch column.

### Words over symbols

The font subsets in `src/fonts` cover Latin, punctuation, and arrows. Measured on the full faces, Geist has `∂`, `√`, `∑`, and `≈` but not `θ`, `σ`, `η`, `ε`, or `∇`. The subset has none of them. Using `∂` in a note fails `pnpm build`. Using `θ` falls back to a system font. The notes write "the slope", "learning rate", and code like `dloss / dw` instead. `×`, `·`, `²`, and `½` are in the subset and are fine.

### Lowercase

The root lowercases every visible character except code, so "GPT" shows as "gpt" without any work. The MDX source is written in lowercase anyway, so it reads the way the page does.

### A glossary and a series index on every note

Each note ends with its glossary as index rows, with the term in the lead cell and a one-line meaning in the main cell. Each note also lists the four notes as an index section, with the current one marked, so a reader can move through the series in order. A part that is not published yet shows its title with "coming soon" and no link.

The footer's `next:` link points at the next older note. Inside the series that is the previous part, so part 2 would say `next: how a machine learns`, which reads backwards. A note in the series gets `← part 1` and `part 3 →` in its footer instead.

## Data

| Note | Data | Size | Source and license |
| --- | --- | --- | --- |
| 1 | taxi rides | 8 rides | Made up, 0.3 to 2.4 km long, with a starting fee near 5 and a price near 1.5 per kilometer, plus traffic. The note says so. The author's own ride receipts are a drop-in swap |
| 1 | comfortable days, light switches, two groups, spiral | 100 points each | Made up. The note says so |
| 2 | names | 32,033 names, 228 KB | `names.txt` from karpathy/makemore, MIT. The README says it holds the most common names from ssa.gov for 2018 |
| 3, 4 | tiny shakespeare | 1.1 MB | `input.txt` from karpathy/char-rnn, public domain text. Part 3's heads demo loads part 4's checkpoint, so it is trained on this text |
| 4, option | pan tadeusz | 494 KB | Wolne Lektury `pan-tadeusz.txt`. The file says the poem is in the public domain and the extra material is under Licencja Wolnej Sztuki 1.3. The corpus keeps only the poem |

The taxi rides use different numbers from the sample's 3 and 2, so the opening example does not give the answer away. Tiny shakespeare is a known text that many people train on. Note 4 trains it lowercased, which matches what the site shows. Lowercasing shrinks the alphabet from 65 characters to 39, so our losses compare with other lowercase runs, not with the usual mixed-case numbers. Pan Tadeusz is the personal option. It is Polish, rhymed, and fixed at thirteen syllables a line. It learns slower, and at two minutes it writes Polish-shaped words rather than readable ones. So it fits as a second checkpoint trained offline, not as the live demo. Whether it ships at all is the author's call. The subsets already cover Polish letters.
