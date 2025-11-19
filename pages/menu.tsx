import Head from 'next/head';
import Script from 'next/script';
import Image from 'next/image';
import Header from '../components/Header';
import Footer from '../components/Footer';

const MenuPage = () => (
  <>
    <Head>
        {/*Google tag (gtag.js)*/}
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-MXRBK3QFC4" strategy='afterInteractive'></Script>
        <Script id='google-analytics' strategy='afterInteractive'>
            {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());

                gtag('config', 'G-MXRBK3QFC4');
            `}
        </Script>
      <title>Menu - A-Ru Sushi</title>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      <link rel="stylesheet" href="style/style.css" />
    </Head>
    <Header />
    <main>
      <section className="our-menu" id="menu">
      <h1 className="heading">Lunch (11am - 3pm)</h1>
        <div className="menu-container">
            <div className="item">
                <div className="item-name">
                    <div className="item-name-desc">
                        <h2>Lunch Combination</h2>
                        <h3>*Served with miso soup and rice</h3>
                    </div>
                    
                    <Image src="/img/bento.png" alt="Bento" width={100} height={100}/>
                </div>

                <div className="item-body">
                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Lunch Bento Special: Choice of 2 Items below</h3>
                            <span className="dots"></span>
                            <h3 id="price">$18.95</h3>
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">*also comes with salad. (1st choice: Chicken Teriyaki, Beef Teriyaki, Chicken Cutlet, Spicy Sesame Chicken, Salmon Teriyaki, Shrimp & Veggie Tempura) (2nd choice: Sashimi, Sushi, California roll, Spicy Albacore Roll)</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Special Combination</h3>
                            <span className="dots"></span>
                            <h3 id="price">$21.90</h3>
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">5pcs sushi of Chef's choice & customer's choice of 1 roll (911 roll, Alaskan roll, Aloha roll, Caterpillar roll, Crunchy roll, Dragon roll, Fire Cracker roll, Shrimp roll, Baked Salmon roll, Rainbow roll, Red Dragon roll)</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Choose Any 2 Different Items</h3>
                            <span className="dots"></span>
                            <h3 id="price">$19.95</h3>
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Beef Teriyaki, Chicken Teriyaki, Salmon Teriyaki, Spicy Pork, Shrimp & Vegetable Tempura, Gyoza, Chicken Cutlet, Califora & Spicy Tuna roll, Sushi 5pcs</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Choose Any 3 Different Items</h3>
                            <span className="dots"></span>
                            <h3 id="price">$24.95</h3>
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Beef Teriyaki, Chicken Teriyaki, Salmon Teriyaki, Spicy Pork, Shrimp & Vegetable Tempura, Gyoza, Chicken Cutlet, Califora & Spicy Tuna roll, Sushi 5pcs</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="item">
                <div className="item-name">
                    <h2>Salads</h2>
                    <Image src="/img/Salads.png" alt="Salads" width={100} height={100}/>
                </div>

                <div className="item-body">
                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Sashimi Salad</h3>
                            <span className="dots"></span>
                            <h3 id="price">$19.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Assorted fish with mixed salad and ginger dressing</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="item">
                <div className="item-name">
                    <div className="item-name-desc">
                        <h2>A La Carte</h2>
                        <h3>*Served with rice & miso soup</h3>
                    </div>
                    <Image src="/img/carte.png" alt="A La Carte" width={100} height={100}/>
                </div>

                <div className="item-body">
                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Sashimi Combination</h3>
                            <span className="dots"></span>
                            <h3 id="price">$29.50</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Hot Stone Bibimbap</h3>
                            <span className="dots"></span>
                            <h3 id="price">$21.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Korean style beef, vegetables, and egg over rice</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Fried Rice</h3>
                            <span className="dots"></span>
                            <h3 id="price">$14.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Chickene, shrimp, and vegetables</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="item">
                <div className="item-name">
                    <h2>Udon/Noodles</h2>
                    <Image src="/img/Noodles.png" alt="Noodles" width={100} height={100}/>
                </div>

                <div className="item-body">
                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Udon with choice of one item below</h3>
                            <span className="dots"></span>
                            <h3 id="price">$16.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Roll (California or Spicy tuna) or Shrimp & Vegetable Tempura</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Ramen</h3>
                            <span className="dots"></span>
                            <h3 id="price">$13.50</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Mild or Spicy Korean style ramen noodle (Add-ons: ham(+$1.50), cheese(+$1.00), egg(+$1.00), rice cake(+$1.00))</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="item">
                <div className="item-name">
                    <div className="item-name-desc">
                        <h2>Rice Bowls</h2>
                        <h3>*Served with miso soup</h3>
                    </div>
    
                    <Image src="/img/Rice_bowl.png" alt="Rice Bowls" width={100} height={100}/>
                </div>

                <div className="item-body">
                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Bulgogi Bowl</h3>
                            <span className="dots"></span>
                            <h3 id="price">$16.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Korean marinated beef bulgogi & vegetables over rice</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Chicken Bowl</h3>
                            <span className="dots"></span>
                            <h3 id="price">$15.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Marinated chicken & vegetables over rice</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Katsu Don</h3>
                            <span className="dots"></span>
                            <h3 id="price">$17.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Pork cutlet with sautteed vegetablees and egg over rice</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Unagi Don</h3>
                            <span className="dots"></span>
                            <h3 id="price">$25.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Broiled eel served over rice</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Chirashi Sushi</h3>
                            <span className="dots"></span>
                            <h3 id="price">$27.50</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">A variety of sashimi over sushi rice</span>
                        </div>
                    </div>
                </div>
            </div>

            
        </div>
        <h1 className="heading">Dinner</h1>
        
        <div className="menu-container">
            <div className="item">
                <div className="item-name">
                    <h2>Appetizers</h2>
                    <Image src="/img/Appetizer.png" alt="Appetizers" width={100} height={100}/>
                </div>

                <div className="item-body">
                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Gyoza</h3>
                            <span className="dots"></span>
                            <h3 id="price">$8.95</h3>
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Fried ground shrimp or chicken wrapped in wonton</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Agedashi Tofu</h3>
                            <span className="dots"></span>
                            <h3 id="price">$7.50</h3>
                        </div>

                        <div className="item-desc">
                            <span className="description">Deep fried tofu served with ponzu sauce</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Yakitori</h3>
                            <span className="dots"></span>
                            <h3 id="price">$7.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Charbroiled skewered chicken, served with teriyaki sauce on top</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Fried Calamari</h3>
                            <span className="dots"></span>
                            <h3 id="price">$8.50</h3>    
                        </div>
                        
                        
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Soft Shell Crab</h3>
                            <span className="dots"></span>
                            <h3 id="price">$11.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Deep fried soft shell crab</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Baked Yellowtail Collar</h3>
                            <span className="dots"></span>
                            <h3 id="price">$13.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Baked Salmon Collar</h3>
                            <span className="dots"></span>
                            <h3 id="price">$11.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Edamame</h3>
                            <span className="dots"></span>
                            <h3 id="price">$5.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Garlic Edamame</h3>
                            <span className="dots"></span>
                            <h3 id="price">$7.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Spicy Edamame</h3>
                            <span className="dots"></span>
                            <h3 id="price">$7.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Baked Green Mussels</h3>
                            <span className="dots"></span>
                            <h3 id="price">$9.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Baked green mussels with spicy mayo, eel sauce on top</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Half Shell Oyster</h3>
                            <span className="dots"></span>
                            <h3 id="price">$16.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">6 pieces of oyster with green onions, spicy & ponzu sauce</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Egg Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$7.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Monkey Brain</h3>
                            <span className="dots"></span>
                            <h3 id="price">$8.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Deep fried -- spicy crabmeat, cream cheese, mushroom inside with mayo and eel sauce on top</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Oyster Shooter</h3>
                            <span className="dots"></span>
                            <h3 id="price">$9.50</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Oyster with sake, masago, spicy ponzu sauce</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Uni Shooter</h3>
                            <span className="dots"></span>
                            <h3 id="price">$12.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Uni with sake, masago, spicy ponzu sauce</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Dynamite</h3>
                            <span className="dots"></span>
                            <h3 id="price">$10.50</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Baked -- Crabmeat, mixed vegetable, baby crawfish and scallop with eel & mayo sauce on top</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Shrimp & Vegetable Tempura</h3>
                            <span className="dots"></span>
                            <h3 id="price">$12.50</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Heart Attack</h3>
                            <span className="dots"></span>
                            <h3 id="price">$10.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Fried jalapeños stuffed with cream cheese, spicy tuna inside with eel and mayo sauce</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="item">
                <div className="item-name">
                    <h2>Salads</h2>
                    <Image src="/img/Salads.png" alt="Salads" width={100} height={100}/>
                </div>

                <div className="item-body">
                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Garden Salad</h3>
                            <span className="dots"></span>
                            <h3 id="price">$6.50</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Spring mixed salad served with house dressing</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Seaweed Salad</h3>
                            <span className="dots"></span>
                            <h3 id="price">$9.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Seasoned seaweed salad</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Sashimi Salad</h3>
                            <span className="dots"></span>
                            <h3 id="price">$19.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Assorted fish with mixed salad and ginger dressing</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Poki Salad</h3>
                            <span className="dots"></span>
                            <h3 id="price">$17.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Japanese style tuna salad - mild to medium spicy</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Tako Salad</h3>
                            <span className="dots"></span>
                            <h3 id="price">$11.50</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Marinated octopus with mixed salad</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Cucumber Salad</h3>
                            <span className="dots"></span>
                            <h3 id="price">$6.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Cucumber vinaigrette with stick crab on top</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="item">
                <div className="item-name">
                    <h2>House Special Rolls</h2>
                    <Image src="/img/Rolls1.png" alt="Rolls" width={100} height={100}/>
                </div>

                <div className="item-body">
                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Aloha Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$15.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Spicy tuna and cucumber inside and tuna, ponzu sauce on top</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Super Volcano Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$17.50</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Baked -- California roll with salmon & spicy tuna on top. Baked with eel sauce on top</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Spider Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$15.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Crabmeat, soft shell crab, avocado, gobo, sprout radish and eel sauce</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Baked Salmon Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$14.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Baked -- California roll with baked salmon on top. Eel sauce on top</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Caterpillar Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$15.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Eel, crabmeat inside with avocado & eel sauce on top</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Shrimp Killer Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$15.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Inside: Crabmeat, cucumber, shrimp tempura;  Outside: Ebi shrimp, avocado on top with eel sauce, spicy mayo sauce</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Baked Dynamite Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$15.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Baked -- California roll with crabmeat, scallop, vegetable mix on top. Eel sauce on top</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Rainbow Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$15.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">A House Favorite! California roll wrapped with assorted pieces of fish and avocado on top</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">OMG Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$18.50</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Inside: Shrimp tempura, crabmeat, cucumber;  Outside: Fried crawfish, masago, avocado with eel sauce on top</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Japanese Lasagña</h3>
                            <span className="dots"></span>
                            <h3 id="price">$14.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Baked -- California roll with baked cream cheese and eel sauce on top</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Alaskan Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$15.50</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">California roll with asparagus inside and fresh salmon on top. No sauce</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Sunshine Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$15.50</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">California roll topped with assorted fish marinated in house spicy sauce</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Drunken Tiger Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$16.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Baked -- Inside: Spicy tuna, albacore;  Outside: Salmon, eel sauce, spicy mayo on top</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Philadelphia Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$16.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Inside: Salmon, cream cheese, asparagus, avocado;  Outside: Salmon, masago, and mustard sauce</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">911 Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$16.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Baked -- Inside: Spicy tuna, albacore;  Outside: Salmon, eel sauce, spicy mayo on top</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Green Salmon Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$14.50</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">No rice roll. Salmon, asparagus, radish beets, avocado, gobo, sprouts inside wrapped wiht cucumber. Ginger sauce on top</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Red Dragon Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$15.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Crabmeat and eel inside, topped with spicy tuna, eel sauce on top</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Creamy Hamachi Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$16.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Spicy crabmeat, avocado, shrimp tempura inside and yellowtail, creamy sauce outside</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Oh Tiger Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$15.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Spicy crabmeat, avocado, asparagus inside. Roll deep fried with eel sauce & white sauce on top</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Vegas Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$14.50</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Inside: Spicy tuna, cream cheese, salmon avocado. Roll deep fried with mayo and eel sauce on top</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Dragon Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$16.50</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">California roll with fresh water eel and avocado on top, served with eel sauce on top</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Fire Cracker Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$16.50</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Spicy crabmeat, cucumber inside with spicy tuna, jalapeño on top with hot sauce</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Yakuza Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$16.50</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Spicy tuna, cucumber inside with salmon, tuna, jalapeño on top with hot sauce</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Something Wrong Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$17.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Spicy tuna, shrimp tempura, cucumber inside and albacore, avocado, fried onion outside on top</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Avocado Bomb</h3>
                            <span className="dots"></span>
                            <h3 id="price">$16.50</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Not a roll. A ball of spicy tuna, shrimp tempura covered with avocado. Served with chips around. Mayo and eel sauce on top</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Vegetarian Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$14.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Assorted vegetables (yellow radish, asparagus, gobo, sprouts, seaweed), avocado wrapped with cucumber. Ginger sauce</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">La Geisha Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$16.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Spicycrabmeat, spicy tuna inside and wrapped with tuna, salmon outside with rayu mustard sauce on top</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Tarantula Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$16.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Fried soft shell crab and crabmeat wrapped with avocado on top. Served with bonito flakes & eel sauce</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Jalama Beach Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$16.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Spicy tuna and cucumber inside and yellowtail, thin sliced lemons and ponzu sauce on top</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Lobster Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$15.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Baked -- California roll topped with baked crawfish and eel sauce</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Baked Scallop Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$15.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Baked -- California roll topped with baked scallop and eel sauce</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Vegetable Tempura Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$12.50</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Deep fried vegetable tempura wrapped in seaweed paper and rice wtih eel sauce on top</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Crazy Boy Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$15.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">No rice roll. Whole roll deep fried -- spicy crabmeat, cilantro, jalapeño, cream cheese wrapped with tortilla with eel, mayo and hot sauce.</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Special Combination</h3>
                            <span className="dots"></span>
                            <h3 id="price">$34.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">8 pieces of sushi on Chef's choice with Customer's choice of 1 House Special Roll. Served with garden salad & miso soup </span>
                            <span className="description">(911 Roll, Alaskan Roll, Albacore Delight Roll, Caterpillar Roll, Crunchy Roll, Dragon Roll, Fire Cracker Roll, Golden California Roll, Hot Night Roll, Rainbow Roll, Red Dragon Roll)(**substitute for any other roll for extra charge)</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="item">
                <div className="item-name">
                    <h2>Basic Rolls</h2>
                    <Image src="/img/Rolls.png" alt="Rolls" width={100} height={100}/>
                </div>

                <div className="item-body">
                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Tuna Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$9.50(Hand) $11.50(Cut)</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">California Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$9.50(Hand) $10.50(Cut)</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Spicy Tuna Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$8.50(Hand) $9.50(Cut)</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Cucumber Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$5.50(Hand) $7.95(Cut)</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Salmon Skin Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$7.50(Hand) $8.95(Cut)</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Scallop Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$7.50(Hand) $9.50(Cut)</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Yellowtail Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$9.50(Hand) $10.95(Cut)</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Salmon Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$8.50(Hand) $9.50(Cut)</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Avocado Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$7.50(Hand) $8.50(Cut)</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Unagi Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$9.50(Hand) $11.50(Cut)</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Shrimp Tempura Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$9.50(Hand) $13.50(Cut)</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Albacore Tempura Roll</h3>
                            <span className="dots"></span>
                            <h3 id="price">$9.50(Hand) $12.50(Cut)</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="item">
                <div className="item-name">
                    <h2>Sashimi</h2>
                    <Image src="/img/Sashimi.png" alt="Sashimi" width={100} height={100}/>
                </div>

                <div className="item-body">
                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Tuna</h3>
                            <span className="dots"></span>
                            <h3 id="price">$19.50</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>
                </div>

                <div className="item-body">
                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Salmon</h3>
                            <span className="dots"></span>
                            <h3 id="price">$17.50</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>
                </div>

                <div className="item-body">
                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Albacore</h3>
                            <span className="dots"></span>
                            <h3 id="price">$17.50</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>
                </div>

                <div className="item-body">
                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Halibut</h3>
                            <span className="dots"></span>
                            <h3 id="price">$24.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>
                </div>

                <div className="item-body">
                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Yellowtail</h3>
                            <span className="dots"></span>
                            <h3 id="price">$19.50</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>
                </div>

                <div className="item-body">
                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Mackerel</h3>
                            <span className="dots"></span>
                            <h3 id="price">$16.50</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>
                </div>

                <div className="item-body">
                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Octopus</h3>
                            <span className="dots"></span>
                            <h3 id="price">$15.50</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>
                </div>

                <div className="item-body">
                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Escolar</h3>
                            <span className="dots"></span>
                            <h3 id="price">$16.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>
                </div>

                <div className="item-body">
                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Combination #1</h3>
                            <span className="dots"></span>
                            <h3 id="price">$26.50</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">12 pieces of Chef's choice</span>
                        </div>
                    </div>
                </div>

                <div className="item-body">
                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Combination #2</h3>
                            <span className="dots"></span>
                            <h3 id="price">$29.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">16 pieces of Chef's choice</span>
                        </div>
                    </div>
                </div>

                <div className="item-body">
                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Combination #3</h3>
                            <span className="dots"></span>
                            <h3 id="price">$37.50</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">24 pieces of Chef's choice</span>
                        </div>
                    </div>
                </div>

                <div className="item-body">
                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Tuna Tataki</h3>
                            <span className="dots"></span>
                            <h3 id="price">$19.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Seared tuna with Japanese dressing</span>
                        </div>
                    </div>
                </div>

                <div className="item-body">
                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Halibut Carpaccio</h3>
                            <span className="dots"></span>
                            <h3 id="price">$25.50</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">With olive oil sea salt, pepper and carpaccio sauce</span>
                        </div>
                    </div>
                </div>

                <div className="item-body">
                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Albacore Tataki</h3>
                            <span className="dots"></span>
                            <h3 id="price">$19.50</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Seared albacore wwith Japanese dressing</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="item">
                <div className="item-name">
                    <h2>Rice Bowls</h2>
                    <Image src="/img/Rice_bowl.png" alt="Rice Bowls" width={100} height={100}/>
                </div>

                <div className="item-body">
                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Bulgogi Bowl</h3>
                            <span className="dots"></span>
                            <h3 id="price">$16.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Korean marinated beef bulgogi & vegetables overe rice</span>
                        </div>
                    </div>
                </div>

                <div className="item-body">
                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Chicken Bowl</h3>
                            <span className="dots"></span>
                            <h3 id="price">$15.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Marinated chicken & vegetables over rice</span>
                        </div>
                    </div>
                </div>

                <div className="item-body">
                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Katsu Don</h3>
                            <span className="dots"></span>
                            <h3 id="price">$17.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Pork cutlet with sauteed vegetables and egg over rice</span>
                        </div>
                    </div>
                </div>

                <div className="item-body">
                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Hot Stone Bibimbap</h3>
                            <span className="dots"></span>
                            <h3 id="price">$21.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Korean style beef, vegetables and egg over rice</span>
                        </div>
                    </div>
                </div>

                <div className="item-body">
                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Unagi Don</h3>
                            <span className="dots"></span>
                            <h3 id="price">$25.75</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Broiled eel served over rice</span>
                        </div>
                    </div>
                </div>

                <div className="item-body">
                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Chirashi Sushi</h3>
                            <span className="dots"></span>
                            <h3 id="price">$27.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">A variety of sashimi over sushi rice</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="item">
                <div className="item-name">
                    <div className="item-name-desc">
                        <h2>Dinner Combination</h2>
                        <h3>*Served wwith rice, garden salad & miso soup</h3>
                    </div>
                    
                    <Image src="/img/dinner_comb.png" alt="Dinner Combinations" width={100} height={100}/>
                </div>

                <div className="item-body">
                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Dinner Combination #1</h3>
                            <span className="dots"></span>
                            <h3 id="price">$25.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Choose any 2 different items from the list: Beef teriyaki, chicken teriyaki, salmon teriyaki, spicy pork, short rib bbq (+$3.00), shrimp & vegetable tempura, gyoza, chicken cutlet</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Dinner Combination #2</h3>
                            <span className="dots"></span>
                            <h3 id="price">$29.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Choose any 3 different items from the list: Beef teriyaki, chicken teriyaki, salmon teriyaki, spicy pork, short rib bbq (+$3.00), shrimp & vegetable tempura, gyoza, chicken cutlet</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="item">
                <div className="item-name">
                    <h2>Udon/Noodles</h2>
                    <Image src="/img/Noodles.png" alt="Noodles" width={100} height={100}/>
                </div>

                <div className="item-body">
                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Tempura Udon</h3>
                            <span className="dots"></span>
                            <h3 id="price">$17.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Udon soup served with tempura on the side</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Yakisoba</h3>
                            <span className="dots"></span>
                            <h3 id="price">$15.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Sauteed Japanesee noodles with vegetables, chicken and shrimp. No soup</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Nabeyaki Udon</h3>
                            <span className="dots"></span>
                            <h3 id="price">$18.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Seafood udon soup with egg inside</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Ramen</h3>
                            <span className="dots"></span>
                            <h3 id="price">$13.50</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Spicy or Mild Korean style ramen noodle (Add-ons: Ham(+$1.50), Cheese(+$1.00), Egg(+$1.00), Rice Cake(+$1.00))</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="item">
                <div className="item-name">
                    <div className="item-name-desc">
                        <h2>A La Carte</h2>
                        <h3>*Served with rice & miso soup</h3>
                        <h3>*All over stir-fried vegetables on a sizzling platter</h3>
                    </div>
                    <Image src="/img/carte.png" alt="A La Carte" width={100} height={100}/>
                </div>

                <div className="item-body">
                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Vegetable Tempura</h3>
                            <span className="dots"></span>
                            <h3 id="price">$16.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Assorted fresh vegetable tempura</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Shrimp Tempura</h3>
                            <span className="dots"></span>
                            <h3 id="price">$18.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Shrimp and vegetable tempura</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Beef Teriyaki</h3>
                            <span className="dots"></span>
                            <h3 id="price">$29.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">USDA Choice ribeye with sauteed vegetables</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Bulgogi Teriyaki</h3>
                            <span className="dots"></span>
                            <h3 id="price">$21.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Korean style marinated beef stir-fried with sauteed vegetables</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Chicken Teriyaki</h3>
                            <span className="dots"></span>
                            <h3 id="price">$19.50</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Grilled chicken breast with sauteed vegetables</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Salmon Teriyaki</h3>
                            <span className="dots"></span>
                            <h3 id="price">$21.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Curry/Tonkatsu Chicken</h3>
                            <span className="dots"></span>
                            <h3 id="price">$21.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Chicken tonkatsu curry over rice</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Curry/Tonkatsu Pork</h3>
                            <span className="dots"></span>
                            <h3 id="price">$22.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Pork tonkatsu curry over rice</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Short Rib BBQ</h3>
                            <span className="dots"></span>
                            <h3 id="price">$32.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Grilled short ribs marinated with house sauce</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Pork Cutlet</h3>
                            <span className="dots"></span>
                            <h3 id="price">$19.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Chicken Cutlet</h3>
                            <span className="dots"></span>
                            <h3 id="price">$19.90</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Combination Seafood Teriyaki</h3>
                            <span className="dots"></span>
                            <h3 id="price">$25.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Seafood assorted (shrimp, scallops, white fish) with sauteed vegetables</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="item">
                <div className="item-name">
                    <h2>Boat Combinations</h2>
                    <Image src="/img/Boat.png" alt="Sushi Boat" width={100} height={100}/>
                </div>

                <div className="item-body">
                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Children's Platter</h3>
                            <span className="dots"></span>
                            <h3 id="price">$13.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Assorted fresh vegetable tempura and gyoza (12 & under please)</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Kitchen Boat</h3>
                            <span className="dots"></span>
                            <h3 id="price">$89.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">CA roll, salmon, beef, chicken, tempura, short rib, gyoza selected daily by the chef (minimum order by two persons)</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Love Boat</h3>
                            <span className="dots"></span>
                            <h3 id="price">$95.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Chef's choice of 10 pieces of sushi, 20 pieces sashimi, 2 house special rolls</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="item">
                <div className="item-name">
                    <h2>Sides & Desserts</h2>
                    <Image src="/img/desserts.png" alt="Desserts" width={100} height={100}/>
                </div>

                <div className="item-body">
                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">White Rice</h3>
                            <span className="dots"></span>
                            <h3 id="price">$2.50</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Sushi Rice</h3>
                            <span className="dots"></span>
                            <h3 id="price">$3.00</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Miso Soup</h3>
                            <span className="dots"></span>
                            <h3 id="price">$2.50</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Kimchi</h3>
                            <span className="dots"></span>
                            <h3 id="price">$5.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Mochi Ice cream</h3>
                            <span className="dots"></span>
                            <h3 id="price">$4.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Chocolate, strawberry, mango, green tea</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Tempura Cheesecake</h3>
                            <span className="dots"></span>
                            <h3 id="price">$6.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Deep fried cheesecake</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="item">
                <div className="item-name">
                    <h2>Beverages (Non-alcoholic)</h2>
                    <Image src="/img/beverage.png" alt="Beverage" width={100} height={100}/>
                </div>

                <div className="item-body">
                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Ramune</h3>
                            <span className="dots"></span>
                            <h3 id="price">$4.75</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Hot Tea</h3>
                            <span className="dots"></span>
                            <h3 id="price">$1.75</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Iced Tea</h3>
                            <span className="dots"></span>
                            <h3 id="price">$3.00</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Raspberry, Peach, Sweet, Unsweetened, Ice Green Tea</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Soda</h3>
                            <span className="dots"></span>
                            <h3 id="price">$3.00</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">San Pelligrino Sparkling Water</h3>
                            <span className="dots"></span>
                            <h3 id="price">$3.75</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Perrier Sparkling Water</h3>
                            <span className="dots"></span>
                            <h3 id="price">$3.75</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="item">
                <div className="item-name">
                    <h2>Beer</h2>
                    <Image src="/img/alcohol.png" alt="Alcohol" width={100} height={100}/>
                </div>

                <div className="item-body">
                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Sapporo</h3>
                            <span className="dots"></span>
                            <h3 id="price">$4.50(Small)  $8.50(Large)</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Sapporo Light</h3>
                            <span className="dots"></span>
                            <h3 id="price">$4.50(Small)  $8.50(Large)</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Asahi</h3>
                            <span className="dots"></span>
                            <h3 id="price">$4.50(Small)  $8.50(Large)</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Asahi Light</h3>
                            <span className="dots"></span>
                            <h3 id="price">$4.50(Small)  $8.50(Large)</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Kirin Ichiban</h3>
                            <span className="dots"></span>
                            <h3 id="price">$4.50(Small)  $8.50(Large)</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Kirin Ichiban Light</h3>
                            <span className="dots"></span>
                            <h3 id="price">$4.50(Small)  $8.50(Large)</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Coors Light</h3>
                            <span className="dots"></span>
                            <h3 id="price">$4.00</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Pacifico</h3>
                            <span className="dots"></span>
                            <h3 id="price">$4.00</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Corona</h3>
                            <span className="dots"></span>
                            <h3 id="price">$4.00</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Modelo</h3>
                            <span className="dots"></span>
                            <h3 id="price">$4.00</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Figueroa Mountain</h3>
                            <span className="dots"></span>
                            <h3 id="price">$4.00</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">805</h3>
                            <span className="dots"></span>
                            <h3 id="price">$4.00</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Sapporo on Tap (Pitcher)</h3>
                            <span className="dots"></span>
                            <h3 id="price">$4.50</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Sapporo on Tap (32oz)</h3>
                            <span className="dots"></span>
                            <h3 id="price">$9.50</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="item">
                <div className="item-name">
                    <h2>Sake</h2>
                    <Image src="/img/sake.png" alt="Sake" width={100} height={100}/>
                </div>

                <div className="item-body">
                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Hot Sake </h3>
                            <span className="dots"></span>
                            <h3 id="price">$7.00(Small)  $9.00(Large)</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Sho Chiku Bai Nigori</h3>
                            <span className="dots"></span>
                            <h3 id="price">$12.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Bold, swweet, robust flavor with a clean finish</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Hakutsuru Superior</h3>
                            <span className="dots"></span>
                            <h3 id="price">$15.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">A graceful Sake with fruity scents and a velvety smoothness</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Sho Chiku Bai Ginjo</h3>
                            <span className="dots"></span>
                            <h3 id="price">$12.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description">Delicate, dry and silky smooth. Rich flavor with fruity flavor</span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Sayuri Nigori Sake</h3>
                            <span className="dots"></span>
                            <h3 id="price">$13.95</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Junmai Ginjo Kikusui</h3>
                            <span className="dots"></span>
                            <h3 id="price">$14.00</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Mio Sparkling Sake</h3>
                            <span className="dots"></span>
                            <h3 id="price">$16.50</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Michinoku Onikoroshi</h3>
                            <span className="dots"></span>
                            <h3 id="price">$23.00</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>

                    <div className="item-menu">
                        <div className="item-info">
                            <h3 id="name">Otokoyama</h3>
                            <span className="dots"></span>
                            <h3 id="price">$52.50</h3>    
                        </div>
                        
                        <div className="item-desc">
                            <span className="description"></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>
    </main>
    <Footer />
  </>
);

export default MenuPage;