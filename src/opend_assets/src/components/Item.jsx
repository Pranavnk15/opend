import React, { useEffect, useState } from "react";
import logo from "../../assets/logo.png";
import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory } from "../../../declarations/nft";
import { Principal } from "@dfinity/principal";
import Button from "../../../../node_modules/react-bootstrap/esm/Button";
import {opend } from "../../../declarations/opend";
import CURRENT_USER_ID from "../index";
import PriceLabel from "./PriceLabel";

function Item(props) {
  const [name, setName] = useState();
  const [owner, setOwner] = useState();
  const [image, setImage] = useState();
  const [button , setButton] = useState();
  const [priceInput, setPriceInput] = useState();
  const [loaderHidden, setLoaderHidden] = useState(true);
  const [blur, setBlur] = useState();
  const [sellStatus, setSellStatus] = useState("");
  const [priceLabel, setPriceLabel] = useState();
  const id = props.id;

  const localHost = "http://localHost:8080/";
  const agent = new HttpAgent({host: localHost});
  agent.fetchRootKey();
  let NFTActor;

  async function loadNFT() {

     NFTActor = await Actor.createActor(idlFactory, {
      agent,
      canisterId: id,
    });

    const name = await NFTActor.getName();
    const owner = await NFTActor.getOwner();
    const imageData = await NFTActor.getAsset();
    const imgContent = new Uint8Array(imageData);
    const image = URL.createObjectURL(new Blob([imgContent.buffer], {type: "image/png"}));


    setName(name);
    setOwner(owner.toText());
    setImage(image);

    if(props.role == "collection") {
      const nftIsListed = await opend.isListed(props.id);

      if(nftIsListed) {
        setOwner("OpenD");
        setBlur({filter: "blur(4px"}); 
        setSellStatus("Listed");
      } else {
        setButton(<Button handleClick={handleSell} text ={"Sell"}/>)
      }
    } else if(props.role == "discover") {
      const originalOwner = await opend.getOriginalOwner(props.id);
      if(originalOwner != CURRENT_USER_ID.toText()) {
        setButton(<Button handleClick={handleBuy} text ={"Buy"}/>)
      }

      const price = await opend.getLisyedNFTPrice(props.id);
      setPriceLabel(<PriceLabel sellPrice={price.toString()}/>);
      
    }


  }
 

  useEffect(() => {
    loadNFT();
  }, []);

  let price;
  function handleSell() {
    setPriceInput(<input
      placeholder="Price in DANG"
      type="number"
      className="price-input"
      value={price}
      onChange={(e)=> price.target.value}
    />);
    setButton(<Button handleClick={handleSell} text={"Confirm"}/>);
  }

  async function sellItem() {
    setBlur({filter: "blur(4px"})
    setLoaderHidden(false);
    const listingResult = await opend.listItem(props.id, Number(price));
    if(listingResult == "Success") {
      const openDId = await opend.getOpenDCanisterID();
      const tranferResult = await NFTActor.transferOwnership(openDId, true);
      if(tranferResult == "Success") {
        setLoaderHidden(true);
        setButton();
        setPriceInput();
        setOwner("OpenD");
        setSellStatus("Listed");
      }
    }
  }
  async function handleBuy() {
  
  }

  return (
    <div className="disGrid-item">
      <div className="disPaper-root disCard-root makeStyles-root-17 disPaper-elevation1 disPaper-rounded">
        <img
          className="disCardMedia-root makeStyles-image-19 disCardMedia-media disCardMedia-img"
          src={image}
          style={blur}
        />
        <div className="lds-ellipsis" hidden={loaderHidden}>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
        <div className="disCardContent-root">
          {name}
          <h2 className="disTypography-root makeStyles-bodyText-24 disTypography-h5 disTypography-gutterBottom">
            {name}<span className="purple-text">{sellStatus}</span>
          </h2>
          <p className="disTypography-root makeStyles-bodyText-24 disTypography-body2 disTypography-colorTextSecondary">
            Owner: {owner}
          </p>
          {priceInput}
          {button}
        </div>
      </div>
    </div>
  );
}

export default Item;
