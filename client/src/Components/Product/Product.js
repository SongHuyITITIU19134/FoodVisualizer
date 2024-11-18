/* eslint-disable no-mixed-operators */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-global-assign */
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { Card } from "react-bootstrap";
import { Button } from "@mui/material";
import Pagination from "react-bootstrap/Pagination";
import "./Product.css";
import { MDBInput } from "mdb-react-ui-kit";
import HeaderSub from "../Home/HeaderSub";
import "rsuite/dist/rsuite.min.css";
import Category from "./Category";
import TrafficLight from "../Visualization/Traffic Light System/TrafficLight.js";
import Footer from "../Home/Footer";
import { useChat } from "ai/react";

const PORT = process.env.REACT_APP_PORT;
const URL = process.env.REACT_APP_URL || `http://localhost:${PORT}`;

const Product = ({ isChecked, isToggle }) => {
  const [product, setProduct] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [foodPerPage] = useState(18);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [fatFilter, setFatFilter] = useState("all");
  const [saturatesFilter, setSaturatesFilter] = useState("all");
  const [sugarsFilter, setSugarsFilter] = useState("all");
  const [saltFilter, setSaltFilter] = useState("all");

  const { messages, input, setInput, append, setMessages } = useChat({
    streamProtocol: "text",
    fetch: `${URL || `http://localhost:${PORT}`}/api/chat`,
  });
  const extractCalories = (response) => {
    const caloriesMatch = response.match(/Kcal:\s*(\d+)(?:\s*|\.)/);

    if (caloriesMatch) {
      return caloriesMatch[1];
    } else {
      return null;
    }
  };

  const handleUserInfo = async (e) => {
    e.preventDefault();

    // Ensure inputs are valid before processing
    const parsedAge = parseInt(age, 10);
    const parsedWeight = parseInt(weight, 10);
    const parsedHeight = parseInt(height, 10);

    if (isNaN(parsedAge) || isNaN(parsedWeight) || isNaN(parsedHeight)) {
      alert("Please enter valid numbers for age, weight, and height.");
      return;
    }

    if (!gender || !goal) {
      alert("Please select both gender and goal.");
      return;
    }

    // Create the user info object
    const userInfo = {
      age: parsedAge,
      weight: parsedWeight,
      height: parsedHeight,
      gender,
      goal,
    };

    console.log("User info to be saved:", userInfo);

    // Save user info to localStorage
    localStorage.setItem("userInfo", JSON.stringify(userInfo));

    // Alert the user of success
    alert("User info has been saved successfully!");

    // Create a message to be sent to the chatbot with the user info
    const userMessage = {
      role: "user",
      content: `
        - Age: ${parsedAge}
        - Gender: ${gender}
        - Height: ${parsedHeight} cm
        - Weight: ${parsedWeight} kg
        - Goal: ${goal}
      `,
    };

    try {
      // Send the user info and the message to the backend
      const response = await fetch(
        `${URL || `http://localhost:${PORT}`}/api/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [userMessage], // Send the user message to the chatbot
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response from server:", errorData);
        alert("There was an error processing your request.");
        return;
      }

      const reader = response.body.getReader();

      const decoder = new TextDecoder("utf-8");

      let finalResponse = "";
      let caloriesValue = null;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        finalResponse += decoder.decode(value);
        finalResponse = finalResponse.replace(/[*#]/g, "");
        caloriesValue = extractCalories(finalResponse);

        setKcal(caloriesValue);
      }

      console.log("Kcal in Suggest", kcal);
      const assistantMessage = {
        role: "system",
        content: finalResponse,
      };

      const updatedMessages = [...messages, userMessage, assistantMessage];
      setMessages(updatedMessages);

      // Save the updated messages to localStorage
      localStorage.setItem("chatMessages", JSON.stringify(updatedMessages));

      // Clear the input field
      setInput("");
    } catch (error) {
      console.error("Error fetching chat:", error);
      alert("There was an error sending the request.");
    }
  };

  useEffect(() => {
    const savedMessages = localStorage.getItem("chatMessages");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, [setMessages]);

  const deleteMessage = () => {
    localStorage.removeItem("chatMessages");
    setMessages([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // await append({ role: "user", content: input });
      const newMessage = { role: "user", content: input };
      await append(newMessage);

      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);
      localStorage.setItem("chatMessages", JSON.stringify(updatedMessages));
      // const updatedMessages = [...messages];
      // Send messages to backend
      // console.log("FE: ", updatedMessages);
      const response = await fetch(
        `${URL || `http://localhost:${PORT}`}/api/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ messages: updatedMessages }),
        }
      );

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      // console.log("response: ", response);
      // console.log("reader: ", reader);
      // console.log("decoder: ", decoder);

      let finalResponse = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        finalResponse += decoder.decode(value);
      }
      // append({ role: "system", content: finalResponse });

      const assistantMessage = { role: "system", content: finalResponse };
      // setMessages((prevMessages) => [...prevMessages, assistantMessage]);
      const newMessages = [...updatedMessages, assistantMessage];
      setMessages(newMessages);
      localStorage.setItem("chatMessages", JSON.stringify(newMessages));
      // setMessages([
      //   ...newMessages,
      //   { role: "assistant", content: finalResponse },
      // ]);
      setInput("");
    } catch (error) {
      console.error("Error fetching chat:", error);
    }
  };

  const chatParent = useRef(null);

  useEffect(() => {
    const domNode = chatParent.current;
    if (domNode) {
      domNode.scrollTop = domNode.scrollHeight;
    }
  }, [chatParent]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // const response = await axios.get(
        //   `${URL || `http://localhost:${PORT}`}/product`
        // );
        // const productData = response.data.map((item) => ({
        //   ...item,
        //   img: item.img || null,
        // }));
        // const nutrientResponse = await axios.get(
        //   `${URL || `http://localhost:${PORT}`}/nutrients`
        // );
        // const nutrientData = nutrientResponse.data;

        // const productsWithNutrients = productData.map((productItem) => {
        //   const nutrient = nutrientData.find(
        //     (n) => n.product_id === productItem.product_id
        //   );
        //   return {
        //     ...productItem,
        //     nutrients: nutrient || {},
        //   };
        // });

        // setProduct(productsWithNutrients);
        // setSearchTerm("");

        const response = await axios.get(
          `${URL || `http://localhost:${PORT}`}/product-with-nutrients`
        );
        setProduct(response.data);
        setSearchTerm("");
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProduct();
  }, []);

  useEffect(() => {
    const filterProducts = () => {
      const filtered = product.filter((item) => {
        const { nutrients } = item;
        if (!nutrients) return true;
        const matchesFat =
          fatFilter === "all" ||
          (fatFilter === "low" && nutrients.fat < 3) ||
          (fatFilter === "medium" &&
            nutrients.fat >= 3 &&
            nutrients.fat < 17.5) ||
          (fatFilter === "high" && nutrients.fat >= 17.5);

        const matchesSaturates =
          saturatesFilter === "all" ||
          (saturatesFilter === "low" && nutrients.saturates < 1.5) ||
          (saturatesFilter === "medium" &&
            nutrients.saturates >= 1.5 &&
            nutrients.saturates < 5) ||
          (saturatesFilter === "high" && nutrients.saturates >= 5);

        const matchesSugars =
          sugarsFilter === "all" ||
          (sugarsFilter === "low" && nutrients.sugars < 5) ||
          (sugarsFilter === "medium" &&
            nutrients.sugars >= 5 &&
            nutrients.sugars < 22.5) ||
          (sugarsFilter === "high" && nutrients.sugars >= 22.5);

        const matchesSalt =
          saltFilter === "all" ||
          (saltFilter === "low" && nutrients.salt < 0.3) ||
          (saltFilter === "medium" &&
            nutrients.salt >= 0.3 &&
            nutrients.salt < 1.5) ||
          (saltFilter === "high" && nutrients.salt >= 1.5);

        return matchesFat && matchesSaturates && matchesSugars && matchesSalt;
      });

      setSearchResults(filtered);
    };

    filterProducts();
  }, [fatFilter, saturatesFilter, sugarsFilter, saltFilter, product]);

  useEffect(() => {
    const fetchFilteredProducts = async () => {
      if (selectedCategory) {
        try {
          let api = `${URL || `http://localhost:${PORT}`}/filter`;

          const response = await axios.get(api, {
            params: {
              level0: selectedCategory || null,
            },
          });

          // console.log("Filtered Response:", response.data);

          const filteredProducts = response.data.map((filteredItem) => {
            const productImage = product.find(
              (item) => item.product_id === filteredItem.product_id
            );
            return {
              ...filteredItem,
              product_name: productImage ? productImage.product_name : null,
              img: productImage ? productImage.img : null,
            };
          });
          setSearchResults(filteredProducts);
        } catch (error) {
          console.error("Error fetching filtered products:", error);
        }
      } else {
        setSearchResults([]);
      }
    };

    fetchFilteredProducts();
  }, [selectedCategory, product]);

  useEffect(() => {
    const results = searchTerm
      ? product.filter((productItem) =>
          productItem.product_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        )
      : product;

    setSearchResults(results);
  }, [searchTerm, product, currentPage, foodPerPage]);

  // const handleToggle = () => {
  //   setIsChecked(!isChecked);
  // };

  const last = currentPage * foodPerPage;
  const first = last - foodPerPage;
  const currentFood = searchResults.slice(first, last);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleSearchChange = (event) => {
    const term = event.target.value;
    setSearchTerm(term);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      const results = product.filter((productItem) =>
        productItem.product_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
      setSearchResults(results);
    }
  };

  const handleSelectedCategory = (category) => {
    setSelectedCategory(category);
  };

  const truncate = (nameOfFood, maxLength) => {
    if (!nameOfFood) {
      return "";
    }
    if (nameOfFood.length <= maxLength) {
      return nameOfFood;
    }
    return nameOfFood.substr(0, maxLength) + "...";
  };

  const totalPages = Math.ceil(searchResults.length / foodPerPage);

  const renderPaginationItems = () => {
    const maxPagesToShow = 5;
    const middlePage = Math.ceil(maxPagesToShow / 2);
    let startPage, endPage;

    if (totalPages <= maxPagesToShow) {
      startPage = 1;
      endPage = totalPages;
    } else if (currentPage <= middlePage) {
      startPage = 1;
      endPage = maxPagesToShow;
    } else if (currentPage + middlePage >= totalPages) {
      startPage = totalPages - maxPagesToShow + 1;
      endPage = totalPages;
    } else {
      startPage = currentPage - middlePage + 1;
      endPage = currentPage + middlePage - 1;
    }

    const items = [];
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <Pagination.Item
          key={i}
          active={i === currentPage}
          onClick={() => paginate(i)}
        >
          {i}
        </Pagination.Item>
      );
    }

    if (startPage !== 1) {
      items.unshift(<Pagination.Ellipsis key="startEllipsis" />);
    }

    if (endPage !== totalPages) {
      items.push(<Pagination.Ellipsis key="endEllipsis" />);
    }

    return items;
  };

  const handleNewlines = (text) => {
    return text.split("\n").map((str, index) => (
      <span key={index}>
        {str}
        <br />
      </span>
    ));
  };

  return (
    <>
      <div className="product d-flex flex-column align-items-center w-100 h-100 mb-5">
        <HeaderSub />

        <div
          className="product-items p-1 mx-auto d-flex gap-5"
          style={{ marginTop: "7rem" }}
        >
          <div className="select-items w-25">
            <Category onSelectCategory={handleSelectedCategory} />
            <div style={{ marginBottom: "3.2rem" }}></div>
            {isChecked && (
              <div className="w-100 h-100">
                <div className="w-100 h-auto d-flex justify-content-start mb-4">
                  <h3 className="text-left fs-4">Traffic Light</h3>
                </div>
                <div className="w-100 h-auto d-flex flex-column gap-2">
                  <div className="w-100 h-auto">
                    <label className="w-50 mb-2 fs-6">Fat:</label>
                    <div className="d-flex  w-100 gap-1">
                      <div className="w-auto bg-secondary rounded px-2 py-1 d-flex justify-content-between gap-1">
                        <input
                          type="radio"
                          id="fat-all"
                          name="fat"
                          value="all"
                          checked={fatFilter === "all"}
                          onChange={() => setFatFilter("all")}
                        />
                        <label
                          htmlFor="fat-all"
                          style={{ fontWeight: "bold", color: "black" }}
                        >
                          All
                        </label>
                      </div>
                      <div className="w-auto px-2 py-1 d-flex justify-content-between gap-1 rounded bg-success">
                        <input
                          type="radio"
                          id="fat-low"
                          name="fat"
                          value="low"
                          checked={fatFilter === "low"}
                          onChange={() => setFatFilter("low")}
                        />
                        <label
                          htmlFor="fat-low"
                          style={{ fontWeight: "bold", color: "white" }}
                        >
                          Low
                        </label>
                      </div>

                      <div className="w-auto px-2 py-1 d-flex justify-content-between gap-1 rounded bg-warning">
                        <input
                          type="radio"
                          id="fat-medium"
                          name="fat"
                          value="medium"
                          checked={fatFilter === "medium"}
                          onChange={() => setFatFilter("medium")}
                        />
                        <label
                          htmlFor="fat-medium"
                          style={{ fontWeight: "bold", color: "white" }}
                        >
                          Medium
                        </label>
                      </div>

                      <div className="w-auto px-2 py-1 d-flex justify-content-between gap-1 rounded bg-danger">
                        <input
                          type="radio"
                          id="fat-high"
                          name="fat"
                          value="high"
                          checked={fatFilter === "high"}
                          onChange={() => setFatFilter("high")}
                        />
                        <label
                          htmlFor="fat-high"
                          style={{ fontWeight: "bold", color: "white" }}
                        >
                          High
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="w-100 h-auto">
                    <label className="w-50 mb-2 fs-6">Saturated Fat:</label>
                    <div className="d-flex w-100 gap-1">
                      <div className="w-auto bg-secondary rounded px-2 py-1 d-flex justify-content-between gap-1">
                        <input
                          type="radio"
                          id="saturates-all"
                          name="saturates"
                          value="all"
                          checked={saturatesFilter === "all"}
                          onChange={() => setSaturatesFilter("all")}
                        />
                        <label
                          htmlFor="saturates-all"
                          style={{ fontWeight: "bold", color: "black" }}
                        >
                          All
                        </label>
                      </div>
                      <div className="w-auto px-2 py-1 d-flex justify-content-between gap-1 rounded bg-success">
                        <input
                          type="radio"
                          id="saturates-low"
                          name="saturates"
                          value="low"
                          checked={saturatesFilter === "low"}
                          onChange={() => setSaturatesFilter("low")}
                        />
                        <label
                          htmlFor="saturates-low"
                          style={{ fontWeight: "bold", color: "white" }}
                        >
                          Low
                        </label>
                      </div>

                      <div className="w-auto px-2 py-1 d-flex justify-content-between gap-1 rounded bg-warning">
                        <input
                          type="radio"
                          id="saturates-medium"
                          name="saturates"
                          value="medium"
                          checked={saturatesFilter === "medium"}
                          onChange={() => setSaturatesFilter("medium")}
                        />
                        <label
                          htmlFor="saturates-medium"
                          style={{ fontWeight: "bold", color: "white" }}
                        >
                          Medium
                        </label>
                      </div>

                      <div className="w-auto px-2 py-1 d-flex justify-content-between gap-1 rounded bg-danger">
                        <input
                          type="radio"
                          id="saturates-high"
                          name="saturates"
                          value="high"
                          checked={saturatesFilter === "high"}
                          onChange={() => setSaturatesFilter("high")}
                        />
                        <label
                          htmlFor="saturates-high"
                          style={{ fontWeight: "bold", color: "white" }}
                        >
                          High
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="w-100 h-auto">
                    <label className="w-50 mb-2 fs-6">Sugars:</label>
                    <div className="d-flex  w-100 gap-1">
                      <div className="w-auto bg-secondary rounded px-2 py-1 d-flex justify-content-between gap-1">
                        <input
                          type="radio"
                          id="sugars-all"
                          name="sugars"
                          value="all"
                          checked={sugarsFilter === "all"}
                          onChange={() => setSugarsFilter("all")}
                        />
                        <label
                          htmlFor="sugars-all"
                          style={{ fontWeight: "bold", color: "black" }}
                        >
                          All
                        </label>
                      </div>
                      <div className="w-auto px-2 py-1 d-flex justify-content-between gap-1 rounded bg-success">
                        <input
                          type="radio"
                          id="sugars-low"
                          name="sugars"
                          value="low"
                          checked={sugarsFilter === "low"}
                          onChange={() => setSugarsFilter("low")}
                        />
                        <label
                          htmlFor="sugars-low"
                          style={{ fontWeight: "bold", color: "white" }}
                        >
                          Low
                        </label>
                      </div>

                      <div className="w-auto px-2 py-1 d-flex justify-content-between gap-1 rounded bg-warning">
                        <input
                          type="radio"
                          id="sugars-medium"
                          name="sugars"
                          value="medium"
                          checked={sugarsFilter === "medium"}
                          onChange={() => setSugarsFilter("medium")}
                        />
                        <label
                          htmlFor="sugars-medium"
                          style={{ fontWeight: "bold", color: "white" }}
                        >
                          Medium
                        </label>
                      </div>

                      <div className="w-auto px-2 py-1 d-flex justify-content-between gap-1 rounded bg-danger">
                        <input
                          type="radio"
                          id="sugars-high"
                          name="sugars"
                          value="high"
                          checked={sugarsFilter === "high"}
                          onChange={() => setSugarsFilter("high")}
                        />
                        <label
                          htmlFor="sugars-high"
                          style={{ fontWeight: "bold", color: "white" }}
                        >
                          High
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="w-100 h-auto">
                    <label className="w-50 mb-2 fs-6">Salt:</label>
                    <div className="d-flex  w-100 gap-1">
                      <div className="w-auto bg-secondary rounded px-2 py-1 d-flex justify-content-between gap-1">
                        <input
                          type="radio"
                          id="salt-all"
                          name="salt"
                          value="all"
                          checked={saltFilter === "all"}
                          onChange={() => setSaltFilter("all")}
                        />
                        <label
                          htmlFor="salt-all"
                          style={{ fontWeight: "bold", color: "black" }}
                        >
                          All
                        </label>
                      </div>
                      <div className="w-auto px-2 py-1 d-flex justify-content-between gap-1 rounded bg-success">
                        <input
                          type="radio"
                          id="salt-low"
                          name="salt"
                          value="low"
                          checked={saltFilter === "low"}
                          onChange={() => setSaltFilter("low")}
                        />
                        <label
                          htmlFor="salt-low"
                          style={{ fontWeight: "bold", color: "white" }}
                        >
                          Low
                        </label>
                      </div>

                      <div className="w-auto px-2 py-1 d-flex justify-content-between gap-1 rounded bg-warning">
                        <input
                          type="radio"
                          id="salt-medium"
                          name="salt"
                          value="medium"
                          checked={saltFilter === "medium"}
                          onChange={() => setSaltFilter("medium")}
                        />
                        <label
                          htmlFor="salt-medium"
                          style={{ fontWeight: "bold", color: "white" }}
                        >
                          Medium
                        </label>
                      </div>

                      <div className="w-auto px-2 py-1 d-flex justify-content-between gap-1 rounded bg-danger">
                        <input
                          type="radio"
                          id="salt-high"
                          name="salt"
                          value="high"
                          checked={saltFilter === "high"}
                          onChange={() => setSaltFilter("high")}
                        />
                        <label
                          htmlFor="salt-high"
                          style={{ fontWeight: "bold", color: "white" }}
                        >
                          High
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="container-fluid">
            <div className="d-flex justify-content-between align-items-center">
              <div className="nav-search">
                <div className="form-outline" data-mdb-input-init>
                  <MDBInput
                    type="text"
                    id="formTextExample1"
                    className="form-control"
                    aria-describedby="textExample1"
                    placeholder="Kind Of Food"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onKeyDown={handleKeyDown}
                  />
                  {searchTerm !== "" && (
                    <div style={{ maxHeight: "160px", overflowY: "auto" }}>
                      {searchResults.map((productItem) => (
                        <div
                          key={productItem.product_id}
                          style={{ marginBottom: "10px" }}
                        >
                          <Card.Body>
                            <Link
                              to={`/product-detail/${productItem.product_id}`}
                              style={{ textDecoration: "none" }}
                            >
                              <p>{truncate(productItem.product_name, 50)}</p>
                            </Link>
                          </Card.Body>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div id="textExample1" className="form-text">
                  We have a board of food.
                </div>
              </div>

              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="flexSwitchCheckChecked"
                  checked={isChecked}
                  onChange={isToggle}
                />
                <label
                  className="form-check-label"
                  htmlFor="flexSwitchCheckChecked"
                >
                  Show Nutrition Labelling
                </label>
              </div>
            </div>

            <Row className="d-flex  gap-3 mt-2">
              {currentFood.map((productItem, index) => {
                return (
                  <Col
                    style={{ marginTop: "1rem" }}
                    key={productItem.product_id}
                    xs={12}
                    sm={6}
                    md={4}
                    lg={3}
                    className="w-auto h-auto mx-auto"
                  >
                    <Card
                      style={{
                        width: "18rem",
                        maxHeight: "27.5rem",
                        minHeight: "20rem",
                        height: "100%",
                        // overflow: "hidden",
                      }}
                      // className="w-75 h-75"
                    >
                      {productItem.img ? (
                        <Card.Img
                          variant="top"
                          src={productItem.img}
                          style={{ minHeight: "12rem" }}
                          className="w-100 h-100 overflow-hidden rounded-top"
                        />
                      ) : (
                        <div
                          style={{
                            width: "17rem",
                            height: "12rem",
                            backgroundColor: "#e0e0e0",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <span>No Image Available</span>
                        </div>
                      )}
                      <Card.Body
                        className="w-100 h-auto d-flex justify-content-center align-items-center"
                        style={{ padding: "1rem" }}
                      >
                        <div className="w-100 h-100 d-flex flex-column  align-items-center gap-2">
                          <Card.Title title={productItem.product_name}>
                            {truncate(productItem.product_name, 21)}
                          </Card.Title>
                          {isChecked && (
                            <TrafficLight
                              productId={productItem.product_id}
                              showText={false}
                              mainPage={true}
                              showPerContainer={true}
                              theWidth=""
                            />
                          )}
                          <Link
                            to={`/product-detail/${productItem.product_id}`}
                          >
                            <Button
                              variant="outlined"
                              size="small"
                              color="warning"
                            >
                              View Detail
                            </Button>
                          </Link>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </div>

          <div className="d-flex flex-column w-50 h-75 align-items-center justify-content-center">
            <section className="mb-4">
              <form
                className="d-flex align-items-center"
                onSubmit={handleSubmit}
              >
                <input
                  className="form-control flex-1 me-2"
                  placeholder="Type your question here..."
                  type="text"
                  value={input}
                  onChange={(event) => {
                    setInput(event.target.value);
                  }}
                  // onKeyDown={async (event) => {
                  //   if (event.key === "Enter") {
                  //     append({ content: input, role: "user" });
                  //     // setInput("");
                  //   }
                  // }}
                />
                <button className="btn btn-primary" type="submit">
                  Submit
                </button>
              </form>
              <Button
                variant="contained"
                className="mt-2 w-100"
                size="small"
                color="error"
                onClick={deleteMessage}
              >
                Remove all messages
              </Button>
            </section>

            <section className="container p-0 w-100">
              <ul
                ref={chatParent}
                className="list-unstyled p-3 bg-light rounded-3 shadow-sm overflow-auto"
                style={{ height: "500px" }}
              >
                {messages.map((m, index) => (
                  <li
                    key={m.id || index}
                    className={
                      m.role === "user"
                        ? "d-flex mb-3"
                        : "d-flex flex-row-reverse mb-3"
                    }
                  >
                    <div
                      className={`p-3 rounded-3 shadow-sm ${
                        m.role === "user"
                          ? "bg-primary text-white"
                          : "bg-secondary text-white"
                      }`}
                    >
                      <p className="mb-0 fs-6">{handleNewlines(m.content)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
        <div style={{ marginTop: "6rem" }}>
          <Pagination style={{ display: "flex", justifyContent: "flex-end" }}>
            <Pagination.First onClick={() => paginate(1)} />
            <Pagination.Prev
              onClick={() => paginate(Math.max(1, currentPage - 1))}
            />
            {renderPaginationItems()}
            <Pagination.Next
              onClick={() => paginate(Math.min(currentPage + 1, totalPages))}
            />
            <Pagination.Last onClick={() => paginate(totalPages)} />
          </Pagination>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Product;
