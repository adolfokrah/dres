import type { Payload } from 'payload'

export const seedHeader = async (payload: Payload): Promise<void> => {
  console.log('Seeding Header...')

  try {
    await payload.updateGlobal({
      slug: 'header',
      data: {
        navItems: [
          // New In
          {
            label: 'New In',
            highlighted: false,
            link: {
              type: 'custom',
              url: '/discover/products?sort=newest',
            },
            subItems: [],
          },
          // Designers
          {
            label: 'Designers',
            highlighted: false,
            link: {
              type: 'custom',
              url: '/designers',
            },
            subItems: [],
          },
          // Women
          {
            label: 'Women',
            highlighted: false,
            link: {
              type: 'custom',
              url: '/women',
            },
            subItems: [
              {
                label: 'Clothing',
                link: {
                  type: 'custom',
                  url: '/women/clothing',
                },
                featured: true,
                subItems: [
                  {
                    label: 'Coats',
                    link: {
                      type: 'custom',
                      url: '/discover/products?department=women&collection=clothing&category=coats',
                    },
                  },
                  {
                    label: 'Jackets',
                    link: {
                      type: 'custom',
                      url: '/women/clothing/jackets',
                    },
                  },
                  {
                    label: 'Dresses',
                    link: {
                      type: 'custom',
                      url: '/women/clothing/dresses',
                    },
                  },
                  {
                    label: 'Tops',
                    link: {
                      type: 'custom',
                      url: '/women/clothing/tops',
                    },
                  },
                  {
                    label: 'Trousers',
                    link: {
                      type: 'custom',
                      url: '/women/clothing/trousers',
                    },
                  },
                  {
                    label: 'Skirts',
                    link: {
                      type: 'custom',
                      url: '/women/clothing/skirts',
                    },
                  },
                ],
              },
              {
                label: 'Shoes',
                link: {
                  type: 'custom',
                  url: '/women/shoes',
                },
                featured: false,
                subItems: [
                  {
                    label: 'Trainers',
                    link: {
                      type: 'custom',
                      url: '/women/shoes/trainers',
                    },
                  },
                  {
                    label: 'Boots',
                    link: {
                      type: 'custom',
                      url: '/women/shoes/boots',
                    },
                  },
                  {
                    label: 'Sandals',
                    link: {
                      type: 'custom',
                      url: '/women/shoes/sandals',
                    },
                  },
                  {
                    label: 'Heels',
                    link: {
                      type: 'custom',
                      url: '/women/shoes/heels',
                    },
                  },
                ],
              },
              {
                label: 'Bags & Accessories',
                link: {
                  type: 'custom',
                  url: '/women/bags-accessories',
                },
                featured: false,
                subItems: [
                  {
                    label: 'Handbags',
                    link: {
                      type: 'custom',
                      url: '/women/bags/handbags',
                    },
                  },
                  {
                    label: 'Shoulder Bags',
                    link: {
                      type: 'custom',
                      url: '/women/bags/shoulder-bags',
                    },
                  },
                  {
                    label: 'Clutches',
                    link: {
                      type: 'custom',
                      url: '/women/bags/clutches',
                    },
                  },
                  {
                    label: 'Jewellery',
                    link: {
                      type: 'custom',
                      url: '/women/accessories/jewellery',
                    },
                  },
                  {
                    label: 'Sunglasses',
                    link: {
                      type: 'custom',
                      url: '/women/accessories/sunglasses',
                    },
                  },
                ],
              },
            ],
          },
          // Men
          {
            label: 'Men',
            highlighted: false,
            link: {
              type: 'custom',
              url: '/men',
            },
            subItems: [
              {
                label: 'Clothing',
                link: {
                  type: 'custom',
                  url: '/men/clothing',
                },
                featured: true,
                subItems: [
                  {
                    label: 'Coats',
                    link: {
                      type: 'custom',
                      url: '/men/clothing/coats',
                    },
                  },
                  {
                    label: 'Jackets',
                    link: {
                      type: 'custom',
                      url: '/men/clothing/jackets',
                    },
                  },
                  {
                    label: 'Shirts',
                    link: {
                      type: 'custom',
                      url: '/men/clothing/shirts',
                    },
                  },
                  {
                    label: 'T-shirts',
                    link: {
                      type: 'custom',
                      url: '/men/clothing/tshirts',
                    },
                  },
                  {
                    label: 'Trousers',
                    link: {
                      type: 'custom',
                      url: '/men/clothing/trousers',
                    },
                  },
                  {
                    label: 'Jeans',
                    link: {
                      type: 'custom',
                      url: '/men/clothing/jeans',
                    },
                  },
                ],
              },
              {
                label: 'Shoes',
                link: {
                  type: 'custom',
                  url: '/men/shoes',
                },
                featured: false,
                subItems: [
                  {
                    label: 'Trainers',
                    link: {
                      type: 'custom',
                      url: '/men/shoes/trainers',
                    },
                  },
                  {
                    label: 'Boots',
                    link: {
                      type: 'custom',
                      url: '/men/shoes/boots',
                    },
                  },
                  {
                    label: 'Formal Shoes',
                    link: {
                      type: 'custom',
                      url: '/men/shoes/formal',
                    },
                  },
                ],
              },
              {
                label: 'Accessories',
                link: {
                  type: 'custom',
                  url: '/men/accessories',
                },
                featured: false,
                subItems: [
                  {
                    label: 'Bags',
                    link: {
                      type: 'custom',
                      url: '/men/accessories/bags',
                    },
                  },
                  {
                    label: 'Watches',
                    link: {
                      type: 'custom',
                      url: '/men/accessories/watches',
                    },
                  },
                  {
                    label: 'Sunglasses',
                    link: {
                      type: 'custom',
                      url: '/men/accessories/sunglasses',
                    },
                  },
                ],
              },
            ],
          },
          // We Love
          {
            label: 'We Love',
            highlighted: false,
            link: {
              type: 'custom',
              url: '/discover/products?featured=true',
            },
            subItems: [],
          },
          // Vintage
          {
            label: 'Vintage',
            highlighted: false,
            link: {
              type: 'custom',
              url: '/discover/products?vintage=true',
            },
            subItems: [],
          },
          // Bags
          {
            label: 'Bags',
            highlighted: false,
            link: {
              type: 'custom',
              url: '/discover/products?collection=bags',
            },
            subItems: [
              {
                label: 'Handbags',
                link: {
                  type: 'custom',
                  url: '/bags/handbags',
                },
                featured: false,
              },
              {
                label: 'Shoulder Bags',
                link: {
                  type: 'custom',
                  url: '/bags/shoulder-bags',
                },
                featured: false,
              },
              {
                label: 'Crossbody Bags',
                link: {
                  type: 'custom',
                  url: '/bags/crossbody',
                },
                featured: false,
              },
              {
                label: 'Tote Bags',
                link: {
                  type: 'custom',
                  url: '/bags/tote',
                },
                featured: false,
              },
              {
                label: 'Backpacks',
                link: {
                  type: 'custom',
                  url: '/bags/backpacks',
                },
                featured: false,
              },
            ],
          },
          // Watches & Jewellery
          {
            label: 'Watches & Jewellery',
            highlighted: false,
            link: {
              type: 'custom',
              url: '/discover/products?collection=watches-jewellery',
            },
            subItems: [
              {
                label: 'Watches',
                link: {
                  type: 'custom',
                  url: '/watches',
                },
                featured: true,
              },
              {
                label: 'Necklaces',
                link: {
                  type: 'custom',
                  url: '/jewellery/necklaces',
                },
                featured: false,
              },
              {
                label: 'Bracelets',
                link: {
                  type: 'custom',
                  url: '/jewellery/bracelets',
                },
                featured: false,
              },
              {
                label: 'Rings',
                link: {
                  type: 'custom',
                  url: '/jewellery/rings',
                },
                featured: false,
              },
              {
                label: 'Earrings',
                link: {
                  type: 'custom',
                  url: '/jewellery/earrings',
                },
                featured: false,
              },
            ],
          },
          // Children
          {
            label: 'Children',
            highlighted: false,
            link: {
              type: 'custom',
              url: '/kids',
            },
            subItems: [
              {
                label: 'Girls',
                link: {
                  type: 'custom',
                  url: '/kids/girls',
                },
                featured: false,
              },
              {
                label: 'Boys',
                link: {
                  type: 'custom',
                  url: '/kids/boys',
                },
                featured: false,
              },
              {
                label: 'Baby',
                link: {
                  type: 'custom',
                  url: '/kids/baby',
                },
                featured: false,
              },
            ],
          },
          // Sale
          {
            label: 'Sale',
            highlighted: true,
            link: {
              type: 'custom',
              url: '/discover/products?sale=true',
            },
            subItems: [],
          },
        ],
      },
    })

    console.log('✅ Header seeded successfully')
  } catch (error) {
    console.error('Error seeding header:', error)
    throw error
  }
}
