import dynamic from "next/dynamic";
import Game from "@/components/game";

const Home = () => {
  return (
    <div>
      <h1>{"Press Space to Cut the Rope"}</h1>
      <Game />
    </div>
  );
};

export default Home;