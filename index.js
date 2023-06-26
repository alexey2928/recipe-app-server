const express = require("express");
const app = express();
const cors = require("cors");
const PORT = process.env.PORT || 5000;
require("dotenv").config();

const path = require("path");

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname + "/public")));
app.use((req, res, next) => {
	res.setHeader(
		"Access-Control-Allow-Origin",
		"https://recipe-app-openai-alexk-e21c28a88130.herokuapp.com"
	);
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
	next();
});

const DISH_ATTRIBUTES = {
	dish_name: " ",
	dish_type: " ",
	ingredients: [],
	description: " ",
	cooking_directions: [],
	servings: " ",
	prepping_time: " ",
	cooking_time: " ",
	notes: " ",
};

const IMAGE_ATTRIBUTES = {
	dish_name: "",
	image_URL: "",
};

app.post("/api/chatgpt", async (req, res) => {
	const options = {
		method: "POST",
		headers: {
			Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: "gpt-3.5-turbo",
			messages: [
				{
					role: "user",
					content: `Give me 5 recipes with these ingredients (all or some of them) ${
						req.body.message
					} with the following unique attributes:
            - Name of the Dish
            - Type of the Dish (Appetizer, Main course etc.)
            - Ingredients
            - Description
            - Directions
            - Servings
            - Prepping time
            - Cooking time
            - Notes if any
            Format the response in the array with JSON objects where "key" = number starting with 0, "value" = ${JSON.stringify(
							DISH_ATTRIBUTES
						)}
            `,
				},
			],
		}),
	};
	try {
		const response = await fetch(
			"https://api.openai.com/v1/chat/completions",
			options
		).then((r) => r.json());

		console.log(`GPT Results: ${JSON.stringify(response)}}`);

		const attributes = JSON.parse(response.choices[0].message.content);

		res.status(200).json(attributes);
	} catch (error) {
		console.error("OpenAI API Error:", error);
		res.status(500).json({
			error: error.message,
		});
	}
});

app.post("/api/image", async (req, res) => {
	const options = {
		method: "POST",
		headers: {
			Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			prompt: `Create unique images of a dish from the dish names accordingly: ${req.body.dish_name.map(
				(dish) => dish
			)}, with a plain background that has no text or objects and with the following unique attributes: 
                - name of the dish,
                - image url
            Use each and every dish names in the same order
            Format the response in the array with JSON objects where "key" = number starting with 0, "value" = ${JSON.stringify(
							IMAGE_ATTRIBUTES
						)}`,
			n: 5,
			size: "1024x1024",
		}),
	};
	try {
		const response = await fetch(
			"https://api.openai.com/v1/images/generations",
			options
		).then((r) => r.json());
		// console.log(req.body.dish_name.map((dish) => dish));
		// console.log(`IMAGE Results: ${JSON.stringify(response)}`);

		res.status(200).json(response.data);
	} catch (error) {
		console.error("OpenAI API Error:", error);
		res.status(500).json({
			error: error.message,
		});
	}
});

app.listen(PORT, () => console.log("This server is running on port " + PORT));
